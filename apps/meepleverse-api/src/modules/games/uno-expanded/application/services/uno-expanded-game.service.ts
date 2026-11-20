import { effectContext, type EffectTiming } from "../../domain/models/effect-context.js";
import { advanceExpandedEffects, nextEffectDeadline, pauseEffectClock, resumeEffectClock } from "../../domain/rules/effect-clock.js";
import { randomUUID } from "node:crypto";
import type { RoomMemberView, RoomStatus, MatchOutcome } from "@meepleverse/contracts/room-common";
import type { UnoExpandedEvent, UnoExpandedRoomAction, UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import { createExpandedGame } from "../../domain/rules/create-game.js";
import { getExpandedPlayerView } from "../../domain/rules/get-player-view.js";
import { applyExpandedCommand } from "../../domain/rules/apply-command.js";
import type { UnoExpandedGame } from "../../domain/models/uno-expanded-game.js";
import { requireExpanded } from "../../domain/errors/uno-expanded.errors.js";
export type ExpandedGameFactory = (playerIds: readonly string[]) => UnoExpandedGame;
export class UnoExpandedGameService {
  readonly members: RoomMemberView[] = [];
  hostId: string | null = null;
  revision = 0;
  status: RoomStatus = "LOBBY";
  game: UnoExpandedGame | null = null;
  matchId: string | null = null;
  outcome: MatchOutcome | null = null;
  constructor(readonly roomId: string, private readonly factory: ExpandedGameFactory = createExpandedGame,
    private readonly now: () => number = Date.now, private readonly timing: Partial<EffectTiming> = {}) {}
  private context() { return effectContext({ now: this.now(), timing: this.timing }); }
  get nextDeadline(): number | null { return this.paused || this.status !== "PLAYING" || !this.game ? null : nextEffectDeadline(this.game); }
  advanceTime() {
    if (this.paused || this.status !== "PLAYING" || !this.game) return null;
    const transition = advanceExpandedEffects(this.game, this.context());
    if (transition) { this.game = transition.state; this.updateOutcome(); this.revision++; }
    return transition;
  }
  private updateOutcome(): void {
    if (this.game?.phase === "ended") {
      this.status = "ENDED";
      this.outcome = { reason: this.game.result!.reason === "blocked" ? "blocked" : "completed", winnerId: this.game.result!.winnerId };
    }
  }
  get paused(): boolean { return this.members.some(member => !member.connected); }
  add(playerId: string, nickname: string): void {
    requireExpanded(this.status === "LOBBY", "ROOM_NOT_JOINABLE");
    requireExpanded(this.members.length < 4, "ROOM_FULL");
    this.members.push({ playerId, nickname, connected: true });
    this.hostId ??= playerId; this.revision++;
  }
  setConnected(playerId: string, connected: boolean): void {
    const member = this.members.find(member => member.playerId === playerId);
    if (member && member.connected !== connected) {
      const wasPaused = this.paused; member.connected = connected;
      if (this.game && this.status === "PLAYING" && wasPaused !== this.paused) {
        const updated = this.paused ? pauseEffectClock(this.game, this.context()) : resumeEffectClock(this.game, this.context());
        if (updated) this.game = updated;
      }
      this.revision++;
    }
  }
  leave(playerId: string, expired: boolean): void {
    const index = this.members.findIndex(member => member.playerId === playerId);
    if (index === -1) return;
    this.members.splice(index, 1);
    if (this.hostId === playerId) this.hostId = this.members.find(member => member.connected)?.playerId ?? this.members[0]?.playerId ?? null;
    if (this.status === "PLAYING") {
      this.status = "ENDED";
      this.outcome = { reason: expired ? "reconnection-expired" : "player-left", departedPlayerId: playerId,
        winnerId: this.members.length === 1 ? this.members[0]!.playerId : null };
      this.game = null;
    }
    this.revision++;
  }
  execute(playerId: string, action: UnoExpandedRoomAction["action"]): { state: UnoExpandedGame; events: { public: UnoExpandedEvent[] } } {
    requireExpanded(this.members.some(member => member.playerId === playerId && member.connected), "UNKNOWN_PLAYER");
    requireExpanded(!this.paused, "ROOM_PAUSED");
    if (action.type === "START_GAME") {
      requireExpanded(this.hostId === playerId, "HOST_ONLY");
      requireExpanded(this.status !== "PLAYING", "INVALID_PHASE");
      requireExpanded(action.expectedRoomRevision === this.revision, "STALE_REVISION");
      requireExpanded(this.members.length >= 2, "NOT_ENOUGH_PLAYERS");
      const game = this.factory(this.members.map(member => member.playerId));
      this.game = game; this.matchId = randomUUID(); this.status = "PLAYING"; this.outcome = null; this.revision++;
      return { state: game, events: { public: [{ type: "GAME_STARTED", playerCount: game.players.length, openingCardId: game.discardPile[0]!.id }] } };
    }
    requireExpanded(this.status === "PLAYING" && this.game, "NO_ACTIVE_GAME");
    requireExpanded(action.matchId === this.matchId, "STALE_MATCH");
    const concurrent = action.command.type === "BATTLE_SELECT" || action.command.type === "HIGH_FIVE";
    requireExpanded(concurrent ? action.expectedRevision <= this.game.revision : action.expectedRevision === this.game.revision, "STALE_REVISION");
    const transition = applyExpandedCommand(this.game, playerId, action.command, Math.random, this.context());
    this.game = transition.state;
    this.updateOutcome();
    this.revision++;
    return transition;
  }
  view(playerId: string): UnoExpandedRoomView {
    requireExpanded(this.members.some(member => member.playerId === playerId), "UNKNOWN_PLAYER");
    return { gameId: "uno-expanded", roomId: this.roomId, revision: this.revision, status: this.status, hostId: this.hostId,
      paused: this.paused, members: structuredClone(this.members), selfPlayerId: playerId, matchId: this.matchId,
      game: this.game ? getExpandedPlayerView(this.game, playerId) : null, outcome: this.outcome ? structuredClone(this.outcome) : null };
  }
}

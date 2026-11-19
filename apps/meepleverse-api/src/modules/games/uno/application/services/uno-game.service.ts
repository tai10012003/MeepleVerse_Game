import { randomUUID } from "node:crypto";
import type { RoomAction, RoomMemberView, RoomStatus, UnoRoomView, MatchOutcome } from "@meepleverse/contracts/room";
import { createGame } from "../../domain/rules/create-game.js";
import { applyCommand, type Transition } from "../../domain/rules/apply-command.js";
import { getPlayerView } from "../../domain/rules/get-player-view.js";
import type { UnoGame } from "../../domain/models/uno-game.js";
import { requireRoom } from "../../../../room/domain/room.errors.js";

export type GameFactory = (playerIds: readonly string[]) => UnoGame;
export class UnoGameService {
  readonly members: RoomMemberView[] = [];
  hostId: string | null = null;
  revision = 0;
  status: RoomStatus = "LOBBY";
  game: UnoGame | null = null;
  matchId: string | null = null;
  outcome: MatchOutcome | null = null;
  constructor(readonly roomId: string, private readonly factory: GameFactory = createGame) {}
  get paused(): boolean { return this.members.some(member => !member.connected); }
  add(playerId: string, nickname: string): void {
    requireRoom(this.status === "LOBBY", "ROOM_NOT_JOINABLE");
    requireRoom(this.members.length < 4, "ROOM_FULL");
    this.members.push({ playerId, nickname, connected: true });
    this.hostId ??= playerId;
    this.revision++;
  }
  setConnected(playerId: string, connected: boolean): void {
    const member = this.members.find(member => member.playerId === playerId);
    if (member && member.connected !== connected) { member.connected = connected; this.revision++; }
  }
  leave(playerId: string, expired: boolean): void {
    const index = this.members.findIndex(member => member.playerId === playerId);
    if (index === -1) return;
    this.members.splice(index, 1);
    if (this.hostId === playerId) this.hostId = this.members.find(member => member.connected)?.playerId ?? this.members[0]?.playerId ?? null;
    if (this.status === "PLAYING") {
      this.status = "ENDED";
      this.outcome = {
        reason: expired ? "reconnection-expired" : "player-left", departedPlayerId: playerId,
        winnerId: this.members.length === 1 ? this.members[0]!.playerId : null,
      };
      this.game = null;
    }
    this.revision++;
  }
  execute(playerId: string, action: RoomAction["action"]): Transition | null {
    requireRoom(this.members.some(member => member.playerId === playerId && member.connected), "UNKNOWN_PLAYER");
    requireRoom(!this.paused, "ROOM_PAUSED");
    if (action.type === "START_GAME") {
      requireRoom(this.hostId === playerId, "HOST_ONLY");
      requireRoom(this.status !== "PLAYING", "INVALID_PHASE");
      requireRoom(action.expectedRoomRevision === this.revision, "STALE_REVISION");
      requireRoom(this.members.length >= 2, "NOT_ENOUGH_PLAYERS");
      const game = this.factory(this.members.map(member => member.playerId));
      this.game = game;
      this.matchId = randomUUID();
      this.status = "PLAYING";
      this.outcome = null;
      this.revision++;
      return null;
    }
    requireRoom(this.status === "PLAYING" && this.game, "NO_ACTIVE_GAME");
    requireRoom(action.matchId === this.matchId, "STALE_MATCH");
    requireRoom(action.expectedRevision === this.game.revision, "STALE_REVISION");
    const transition = applyCommand(this.game, playerId, action.command);
    this.game = transition.state;
    if (this.game.phase === "ended") {
      this.status = "ENDED";
      this.outcome = { reason: this.game.result!.reason === "blocked" ? "blocked" : "completed", winnerId: this.game.result!.winnerId };
    }
    this.revision++;
    return transition;
  }
  view(playerId: string): UnoRoomView {
    requireRoom(this.members.some(member => member.playerId === playerId), "UNKNOWN_PLAYER");
    return {
      gameId: "uno-basic", roomId: this.roomId, revision: this.revision, status: this.status, hostId: this.hostId,
      paused: this.paused, members: structuredClone(this.members), selfPlayerId: playerId,
      matchId: this.matchId, game: this.game ? getPlayerView(this.game, playerId) : null,
      outcome: this.outcome ? structuredClone(this.outcome) : null,
    };
  }
}

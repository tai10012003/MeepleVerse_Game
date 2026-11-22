import type { TurnTiming } from "../../application/turn-clock.js";
import { randomUUID } from "node:crypto";
import { Room, ServerError, type Client } from "@colyseus/core";
import type { Schema } from "@colyseus/schema";
import { roomJoinSchema, type ActionReply, type RoomMemberView, type RoomStatus } from "@meepleverse/contracts/room-common";
import type { RoomCodePool } from "../../infrastructure/room-code-pool.js";
export interface RoomTransportSettings { reconnectSeconds: number; codes: RoomCodePool; turnTiming?: Partial<TurnTiming> }
export interface GameRoomService<Action, View> {
  readonly members: RoomMemberView[];
  readonly status: RoomStatus;
  readonly revision: number;
  readonly matchId: string | null;
  readonly game: { revision: number } | null;
  readonly nextDeadline?: number | null;
  advanceTime?(): { state: { revision: number }; events: { public: unknown[] } } | null;
  add(playerId: string, nickname: string): void;
  setConnected(playerId: string, connected: boolean): void;
  leave(playerId: string, expired: boolean): void;
  view(playerId: string): View;
  execute(playerId: string, action: Action): { state: { revision: number }; events: { public: unknown[] } } | null;
}
interface Receipt { fingerprint: string; reply: ActionReply }
/** Edition-neutral transport: never validates card rules or broadcasts private hands. */
export abstract class GameRoom<Action, View, State extends Schema> extends Room<{ state: State }> {
  protected abstract settings: RoomTransportSettings;
  protected service!: GameRoomService<Action, View>;
  protected abstract createService(roomId: string): GameRoomService<Action, View>;
  protected abstract createState(): State;
  protected abstract syncState(): void;
  protected abstract parseAction(payload: unknown): { requestId: string; action: Action } | null;
  protected abstract classifyError(error: unknown): string;
  private readonly identities = new Map<string, string>();
  private readonly receipts = new Map<string, Map<string, Receipt>>();
  private readonly dropped = new Set<string>();
  maxClients = 4;
  maxMessagesPerSecond = 40;

  async onCreate(): Promise<void> {
    this.roomId = this.settings.codes.reserve();
    this.service = this.createService(this.roomId);
    this.setState(this.createState());
    await this.setPrivate(true); // Join by code; do not list rooms or match strangers.
    this.syncState();
    this.onMessage("get_view", client => this.sendView(client));
    this.onMessage("action", (client, payload: unknown) => this.handleAction(client, payload));
    this.onMessage("*", client => this.replyError(client, null, "INVALID_ACTION"));
  }
  onAuth(_client: Client, options: unknown): { nickname: string } {
    const result = roomJoinSchema.safeParse(options);
    if (!result.success) throw new ServerError(400, "INVALID_JOIN");
    if (this.service.status !== "LOBBY") throw new ServerError(409, "ROOM_NOT_JOINABLE");
    return result.data;
  }
  onJoin(client: Client): void {
    // onJoin re-checks capacity/status: reservations can predate START_GAME.
    const nickname = roomJoinSchema.parse(client.auth).nickname;
    const playerId = randomUUID();
    this.service.add(playerId, nickname);
    this.identities.set(client.sessionId, playerId);
    this.receipts.set(client.sessionId, new Map());
    this.publish();
  }
  onDrop(client: Client): void {
    const playerId = this.identities.get(client.sessionId);
    if (!playerId) return;
    this.dropped.add(client.sessionId);
    this.service.setConnected(playerId, false);
    this.allowReconnection(client, this.settings.reconnectSeconds);
    this.publish();
  }
  onReconnect(client: Client): void {
    const playerId = this.identities.get(client.sessionId);
    if (!playerId) return;
    this.dropped.delete(client.sessionId);
    this.service.setConnected(playerId, true);
    this.publish();
  }
  async onLeave(client: Client): Promise<void> {
    const playerId = this.identities.get(client.sessionId);
    if (!playerId) return;
    this.service.leave(playerId, this.dropped.has(client.sessionId));
    this.identities.delete(client.sessionId);
    this.dropped.delete(client.sessionId);
    this.receipts.delete(client.sessionId);
    // ENDED rooms retain the existing group for rematches; new guests join only LOBBY.
    this.publish();
  }
  private turnTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;
  onDispose(): void {
    this.disposed = true;
    if (this.turnTimer) clearTimeout(this.turnTimer);
    this.turnTimer = null;
    this.settings.codes.release(this.roomId);
  }
  private advanceDueTime(): void {
    const deadline = this.service.nextDeadline;
    if (deadline == null || Date.now() < deadline) return;
    const transition = this.service.advanceTime?.();
    if (transition) { this.publish(); this.broadcastEvents(transition); }
  }
  private scheduleDeadline(): void {
    if (this.turnTimer) clearTimeout(this.turnTimer);
    this.turnTimer = null;
    const deadline = this.service.nextDeadline;
    if (this.disposed || deadline == null) return;
    const matchId = this.service.matchId;
    this.turnTimer = setTimeout(() => {
      this.turnTimer = null;
      if (this.disposed || this.service.matchId !== matchId || this.service.nextDeadline !== deadline) return;
      try { this.advanceDueTime(); this.scheduleDeadline(); }
      catch (error) { console.error("Game deadline failed", error); }
    }, Math.max(0, deadline - Date.now()));
  }
  private sendView(client: Client): void {
    const id = this.identities.get(client.sessionId);
    if (id && this.service.members.some(member => member.playerId === id && member.connected)) {
      client.send("room_view", this.service.view(id));
    }
  }
  protected onPublished(): void {}
  protected publish(): void {
    this.syncState();
    for (const client of this.clients) this.sendView(client);
    this.scheduleDeadline();
    this.onPublished();
  }
  protected broadcastEvents(transition: { state: { revision: number }; events: { public: unknown[] } }): void {
    for (const recipient of this.clients) {
      const recipientId = this.identities.get(recipient.sessionId);
      if (!recipientId || this.dropped.has(recipient.sessionId)) continue;
      recipient.send("game_events", { matchId: this.service.matchId, revision: transition.state.revision, events: transition.events.public });
    }
  }
  private reply(client: Client, requestId: string | null, code?: ActionReply["code"]): ActionReply {
    const reply: ActionReply = {
      requestId, ok: !code, ...(code ? { code } : {}),
      roomRevision: this.service.revision, matchId: this.service.matchId,
      gameRevision: this.service.game?.revision ?? null,
    };
    client.send("action_reply", reply);
    return reply;
  }
  private replyError(client: Client, id: string | null, code: NonNullable<ActionReply["code"]>): void { this.reply(client, id, code); }
  private handleAction(client: Client, payload: unknown): void {
    const parsed = this.parseAction(payload);
    if (!parsed) { this.replyError(client, null, "INVALID_ACTION"); return; }
    const { requestId, action } = parsed;
    const playerId = this.identities.get(client.sessionId);
    if (!playerId || this.dropped.has(client.sessionId)) return;
    const cache = this.receipts.get(client.sessionId)!;
    const fingerprint = JSON.stringify(action);
    const previous = cache.get(requestId);
    if (previous) {
      if (previous.fingerprint !== fingerprint) this.replyError(client, requestId, "REQUEST_ID_CONFLICT");
      else { client.send("action_reply", previous.reply); this.sendView(client); }
      return;
    }
    let reply: ActionReply;
    try {
      // Settle expired server time before accepting a packet queued at the deadline.
      this.advanceDueTime();
      const transition = this.service.execute(playerId, action);
      // Update service synchronously; matchmaking lock is only a secondary gate.
      if (this.service.status !== "LOBBY") void this.lock().catch(console.error);
      this.publish();
      if (transition) this.broadcastEvents(transition);
      reply = this.reply(client, requestId);
    } catch (error) {
      const code = this.classifyError(error);
      if (code === "INTERNAL_ERROR") console.error("Room action failed", error);
      reply = this.reply(client, requestId, code);
    }
    cache.set(requestId, { fingerprint, reply });
    // Bound memory per guest. Revisions/match IDs still guard stale requests after eviction.
    if (cache.size > 100) cache.delete(cache.keys().next().value!);
  }
}
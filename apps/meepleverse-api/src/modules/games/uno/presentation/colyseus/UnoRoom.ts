import { randomUUID } from "node:crypto";
import { Room, ServerError, type Client } from "@colyseus/core";
import { roomActionSchema, roomJoinSchema, type RoomActionReply } from "@meepleverse/contracts/room";
import { UnoGameService, type GameFactory } from "../../application/services/uno-game.service.js";
import { RoomRuleError } from "../../../../room/domain/room.errors.js";
import { UnoRuleError } from "../../domain/errors/uno.errors.js";
import { RoomCodePool } from "../../../../room/infrastructure/room-code-pool.js";
import { UnoRoomSchema } from "./schemas/uno.schema.js";
import { syncPublicState } from "./mappers/uno-state.mapper.js";

export interface UnoRoomSettings { reconnectSeconds: number; codes: RoomCodePool; gameFactory?: GameFactory }
interface Receipt { fingerprint: string; reply: RoomActionReply }
export class UnoRoom extends Room<{ state: UnoRoomSchema }> {
  protected settings!: UnoRoomSettings;
  private service!: UnoGameService;
  private readonly identities = new Map<string, string>();
  private readonly receipts = new Map<string, Map<string, Receipt>>();
  private readonly dropped = new Set<string>();
  maxClients = 4;
  maxMessagesPerSecond = 40;

  async onCreate(): Promise<void> {
    this.roomId = this.settings.codes.reserve();
    this.service = new UnoGameService(this.roomId, this.settings.gameFactory);
    this.setState(new UnoRoomSchema());
    await this.setPrivate(true); // Join by code; do not list rooms or match strangers.
    syncPublicState(this.state, this.service);
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
  onDispose(): void { this.settings.codes.release(this.roomId); }
  private sendView(client: Client): void {
    const id = this.identities.get(client.sessionId);
    if (id && this.service.members.some(member => member.playerId === id && member.connected)) {
      client.send("room_view", this.service.view(id));
    }
  }
  private publish(): void {
    syncPublicState(this.state, this.service);
    for (const client of this.clients) this.sendView(client);
  }
  private reply(client: Client, requestId: string | null, code?: RoomActionReply["code"]): RoomActionReply {
    const reply: RoomActionReply = {
      requestId, ok: !code, ...(code ? { code } : {}),
      roomRevision: this.service.revision, matchId: this.service.matchId,
      gameRevision: this.service.game?.revision ?? null,
    };
    client.send("action_reply", reply);
    return reply;
  }
  private replyError(client: Client, id: string | null, code: NonNullable<RoomActionReply["code"]>): void { this.reply(client, id, code); }
  private handleAction(client: Client, payload: unknown): void {
    const parsed = roomActionSchema.safeParse(payload);
    if (!parsed.success) { this.replyError(client, null, "INVALID_ACTION"); return; }
    const { requestId, action } = parsed.data;
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
    let reply: RoomActionReply;
    try {
      const transition = this.service.execute(playerId, action);
      // Update service synchronously; matchmaking lock is only a secondary gate.
      if (this.service.status !== "LOBBY") void this.lock().catch(console.error);
      this.publish();
      if (transition) {
        for (const recipient of this.clients) {
          const recipientId = this.identities.get(recipient.sessionId);
          if (!recipientId || this.dropped.has(recipient.sessionId)) continue;
          recipient.send("game_events", {
            matchId: this.service.matchId, revision: transition.state.revision,
            events: transition.events.public,
          });
        }
      }
      reply = this.reply(client, requestId);
    } catch (error) {
      const code = error instanceof RoomRuleError || error instanceof UnoRuleError ? error.code : "INTERNAL_ERROR";
      if (code === "INTERNAL_ERROR") console.error("UNO action failed", error);
      reply = this.reply(client, requestId, code);
    }
    cache.set(requestId, { fingerprint, reply });
    // Bound memory per guest. Revisions/match IDs still guard stale requests after eviction.
    if (cache.size > 100) cache.delete(cache.keys().next().value!);
  }
}
export function createUnoRoomClass(settings: UnoRoomSettings): typeof UnoRoom {
  // Trusted server settings live in a closure, never merged from client onCreate options.
  return class ConfiguredUnoRoom extends UnoRoom { protected settings = settings; };
}

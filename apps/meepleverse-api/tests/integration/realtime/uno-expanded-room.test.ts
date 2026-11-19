import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Client, type Room } from "@colyseus/sdk";
import type { UnoExpandedActionReply, UnoExpandedGameEvents, UnoExpandedRoomView, UnoExpandedRoomAction } from "@meepleverse/contracts/uno-expanded";
import { createRealtimeServer } from "../../../src/bootstrap/create-realtime-server.js";
import { createExpandedGame } from "../../../src/modules/games/uno-expanded/index.js";
import { seeded } from "../../unit/uno/fixtures.js";
import { waitFor } from "./helpers.js";
function endpointFor(runtime: ReturnType<typeof createRealtimeServer>) {
  const address = runtime.httpServer.address();
  if (!address || typeof address === "string") throw new Error("No address");
  return "http://127.0.0.1:" + address.port;
}

describe("production registration gate", () => {
  it("does not register Expanded by default or trust client opt-in options", async () => {
    const runtime = createRealtimeServer(); await runtime.server.listen(0, "127.0.0.1");
    const sdk = new Client(endpointFor(runtime));
    try {
      await expect(sdk.create("uno-expanded", { nickname: "A", enableExpandedRooms: true })).rejects.toThrow();
      await expect(sdk.create("uno", { nickname: "A", enableExpandedRooms: true })).rejects.toThrow();
      const basic = await sdk.create("uno", { nickname: "Basic" });
      basic.reconnection.enabled = false; basic.onMessage("room_view", () => {});
      await basic.leave();
    } finally { await runtime.server.gracefullyShutdown(false); }
  });
});

describe("internal Expanded WebSocket rooms", () => {
  interface Guest { room: Room; view: UnoExpandedRoomView | null; replies: UnoExpandedActionReply[]; events: UnoExpandedGameEvents[] }
  let runtime: ReturnType<typeof createRealtimeServer>; let endpoint = "";
  const guests: Guest[] = [];
  async function attach(room: Room) {
    const guest: Guest = { room, view: null, replies: [], events: [] }; guests.push(guest);
    room.reconnection.enabled = false; room.onError(() => {});
    room.onMessage("room_view", (view: UnoExpandedRoomView) => { guest.view = view; });
    room.onMessage("action_reply", (reply: UnoExpandedActionReply) => guest.replies.push(reply));
    room.onMessage("game_events", (events: UnoExpandedGameEvents) => guest.events.push(events));
    room.send("get_view"); await waitFor(() => guest.view); return guest;
  }
  async function fresh(guest: Guest) {
    const old = guest.view; guest.room.send("get_view");
    return waitFor(() => guest.view !== old ? guest.view : null);
  }
  async function send(guest: Guest, action: UnoExpandedRoomAction["action"], requestId: string = randomUUID()) {
    const old = guest.replies.length; guest.room.send("action", { requestId, action });
    return waitFor(() => guest.replies.slice(old).find(reply => reply.requestId === requestId));
  }
  async function group(count: number) {
    const host = await attach(await new Client(endpoint).create("uno-expanded", { nickname: "Host" }));
    const group = [host];
    for (let i = 1; i < count; i++) group.push(await attach(await new Client(endpoint).joinById(host.room.roomId, { nickname: "P" + i })));
    await fresh(host); return group;
  }
  async function start(guest: Guest, requestId?: string) {
    await fresh(guest);
    return send(guest, { type: "START_GAME", expectedRoomRevision: guest.view!.revision }, requestId);
  }
  beforeAll(async () => {
    runtime = createRealtimeServer({ enableExpandedRooms: true, reconnectSeconds: 0.6,
      expandedGameFactory: ids => createExpandedGame(ids, seeded(29)) });
    await runtime.server.listen(0, "127.0.0.1"); endpoint = endpointFor(runtime);
  });
  afterEach(async () => {
    await Promise.all(guests.splice(0).map(async guest => {
      guest.room.reconnection.enabled = false;
      if (guest.room.connection.isOpen) await guest.room.leave();
    }));
  });
  afterAll(async () => { await runtime?.server.gracefullyShutdown(false); });
  it.each([2, 3, 4])("prepares a %i-player 198-card room with identical public state and strictly private hands", async count => {
    const players = await group(count); expect((await start(players[0]!)).ok).toBe(true);
    await Promise.all(players.map(fresh));
    const views = players.map(player => player.view!.game!);
    const publicView = (view: typeof views[number]) => Object.fromEntries(Object.entries(view).filter(([key]) => key !== "self"));
    expect(new Set(views.flatMap(view => view.self.hand.map(card => card.id))).size).toBe(count * 7);
    for (const [index, guest] of players.entries()) {
      const view = views[index]!;
      expect(guest.view!.gameId).toBe("uno-expanded"); expect(view.phase).toBe("prepared");
      expect(publicView(view)).toEqual(publicView(views[0]!));
      expect(view.self.hand).toHaveLength(7); expect(view.drawPileCount).toBe(198 - count * 7 - 1);
      expect(view.topCard.kind).toBe("number"); expect(view.currentPlayerId).toBeNull();
      const schema = JSON.stringify(guest.room.state.toJSON());
      await waitFor(() => guest.events.length > 0);
      for (const hand of views.map(view => view.self.hand)) for (const card of hand) {
        expect(schema).not.toContain('"' + card.id + '"');
        expect(JSON.stringify(guest.events)).not.toContain('"' + card.id + '"');
      }
      for (const other of views.filter(other => other.self.playerId !== view.self.playerId)) {
        for (const card of other.self.hand) expect(JSON.stringify(guest.view)).not.toContain('"' + card.id + '"');
      }
    }
    await expect(new Client(endpoint).joinById(players[0]!.room.roomId, { nickname: "Late" })).rejects.toThrow();
  });
  it("guards capacity, ownership, malformed payloads, and stale revisions", async () => {
    const players = await group(4); const [a, b] = players;
    await expect(new Client(endpoint).joinById(a!.room.roomId, { nickname: "Fifth" })).rejects.toThrow();
    expect((await start(b!)).code).toBe("HOST_ONLY");
    expect((await send(a!, { type: "START_GAME", expectedRoomRevision: 0 })).code).toBe("STALE_REVISION");
    const old = a!.replies.length;
    a!.room.send("action", { requestId: "invalid", action: { type: "START_GAME", expectedRoomRevision: a!.view!.revision }, gameId: "uno-basic" });
    expect((await waitFor(() => a!.replies.slice(old).find(reply => reply.code === "INVALID_ACTION"))).ok).toBe(false);
    expect(a!.view!.status).toBe("LOBBY");
  });
  it("deduplicates preparation and rejects all gameplay without mutating either room edition", async () => {
    const [a] = await group(2); const action = { type: "START_GAME" as const, expectedRoomRevision: a!.view!.revision };
    const first = await send(a!, action, "start-once"); await fresh(a!); const before = a!.view!;
    expect(await send(a!, action, "start-once")).toEqual(first);
    expect((await send(a!, { ...action, expectedRoomRevision: 999 }, "start-once")).code).toBe("REQUEST_ID_CONFLICT");
    const command = { type: "GAME_COMMAND" as const, matchId: before.matchId!, expectedRevision: 0, command: { type: "DRAW_CARD" as const } };
    expect((await send(a!, { ...command, matchId: "wrong" })).code).toBe("STALE_MATCH");
    expect((await send(a!, { ...command, expectedRevision: 9 })).code).toBe("STALE_REVISION");
    expect((await send(a!, command)).code).toBe("UNSUPPORTED_COMMAND");
    expect(await fresh(a!)).toEqual(before);
    const basic = await attach(await new Client(endpoint).create("uno", { nickname: "Basic" }));
    expect((basic.view as unknown as { gameId: string }).gameId).toBe("uno-basic");
    expect(basic.room.roomId).not.toBe(a!.room.roomId);
    expect(await fresh(a!)).toEqual(before);
  });
  it("restores the same match and hand after a drop and pauses actions while disconnected", async () => {
    const [a, b] = await group(2); await start(a!); await Promise.all([fresh(a!), fresh(b!)]);
    const saved = structuredClone(b!.view); const token = b!.room.reconnectionToken;
    b!.room.connection.close(1000); await waitFor(() => a!.view?.paused);
    expect((await send(a!, { type: "GAME_COMMAND", matchId: a!.view!.matchId!, expectedRevision: 0, command: { type: "DRAW_CARD" } })).code).toBe("ROOM_PAUSED");
    const restored = await attach(await new Client(endpoint).reconnect(token));
    await waitFor(() => !a!.view?.paused);
    expect(restored.view!.selfPlayerId).toBe(saved!.selfPlayerId); expect(restored.view!.matchId).toBe(saved!.matchId);
    expect(restored.view!.game).toEqual(saved!.game);
  });
  it("ends on reconnection expiry and allows the new host to prepare a fresh match", async () => {
    const [a, b, c] = await group(3); await start(a!); await Promise.all([fresh(a!), fresh(b!), fresh(c!)]);
    const oldMatch = b!.view!.matchId; a!.room.connection.close(1000);
    await waitFor(() => b!.view?.status === "ENDED");
    expect(b!.view!.outcome!.reason).toBe("reconnection-expired"); expect(b!.view!.hostId).toBe(b!.view!.selfPlayerId);
    expect((await start(b!)).ok).toBe(true); await fresh(c!);
    expect(c!.view!.matchId).not.toBe(oldMatch); expect(c!.view!.game!.players).toHaveLength(2);
  });
});

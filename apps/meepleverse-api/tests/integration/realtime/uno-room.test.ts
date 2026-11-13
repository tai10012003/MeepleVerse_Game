import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@colyseus/sdk";
import type { UnoCommand } from "@meepleverse/contracts/uno";
import type { RoomAction } from "@meepleverse/contracts/room";
import { createRealtimeServer } from "../../../src/bootstrap/create-realtime-server.js";
import { createGame } from "../../../src/modules/games/uno/domain/rules/create-game.js";
import { seeded, fixture, number, wild } from "../../unit/uno/fixtures.js";
import { createGuest, joinGuest, attach, fresh, send, start, waitFor, type Guest } from "./helpers.js";

const guests: Guest[] = [];
let endpoint = "";
let runtime: ReturnType<typeof createRealtimeServer>;
let scenario: "normal" | "challenge" = "normal";
async function host() { const guest = await createGuest(endpoint); guests.push(guest); return guest; }
async function join(code: string, name = "Guest") { const guest = await joinGuest(endpoint, code, name); guests.push(guest); return guest; }
async function pair() {
  const a = await host(); const b = await join(a.room.roomId);
  await fresh(a);
  return [a, b] as const;
}
beforeAll(async () => {
  runtime = createRealtimeServer({ reconnectSeconds: 0.5, gameFactory: ids => {
    if (scenario === "challenge") {
      const game = fixture([[wild("four", "wild-draw-four"), number("secret-red")], [number("other")], [number("third")]]);
      game.players.forEach((player, i) => { player.id = ids[i]!; });
      return game;
    }
    return createGame(ids, seeded(17));
  } });
  await runtime.server.listen(0, "127.0.0.1");
  const address = runtime.httpServer.address();
  if (!address || typeof address === "string") throw new Error("Missing test server address");
  endpoint = "http://127.0.0.1:" + address.port;
});
afterEach(async () => {
  scenario = "normal";
  await Promise.all(guests.splice(0).map(async guest => {
    guest.room.reconnection.enabled = false;
    if (guest.room.connection.isOpen) await guest.room.leave();
  }));
});
afterAll(async () => { await runtime?.server.gracefullyShutdown(false); });

describe("real WebSocket UNO rooms", () => {
  it("preserves HTTP health and CORS on the shared server", async () => {
    const response = await fetch(endpoint + "/health", { headers: { Origin: "http://localhost:3000" } });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok", service: "meepleverse-api" });
    expect(response.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
    for (const origin of ["http://localhost:9000", "https://untrusted.example"]) {
      const result = await fetch(endpoint + "/matchmake/create/uno", { method: "OPTIONS", headers: { Origin: origin } });
      expect(result.headers.get("access-control-allow-origin")).toBe(origin.includes("9000") ? origin : null);
    }
    const blocked = await fetch(endpoint + "/health", { headers: { Origin: "https://untrusted.example" } });
    expect(blocked.headers.get("access-control-allow-origin")).toBeNull();
  });
  it("allocates collision-free four-character codes for concurrent rooms", async () => {
    const group = await Promise.all(Array.from({ length: 8 }, () => host()));
    const codes = group.map(guest => guest.room.roomId);
    expect(new Set(codes).size).toBe(8);
    expect(codes.every(code => /^[A-Z0-9]{4}$/.test(code))).toBe(true);
  });
  it("validates nicknames and rejects client-provided identities/settings", async () => {
    const sdk = new Client(endpoint);
    await expect(sdk.create("uno", { nickname: " " })).rejects.toThrow();
    await expect(sdk.create("uno", { nickname: "Guest", playerId: "spoof", reconnectSeconds: 0 })).rejects.toThrow();
  });
  it("enforces capacity and host-only starts, then locks joining", async () => {
    const [a, b] = await pair();
    expect((await start(b)).code).toBe("HOST_ONLY");
    await join(a.room.roomId, "Third");
    await join(a.room.roomId, "Fourth");
    await expect(new Client(endpoint).joinById(a.room.roomId, { nickname: "Fifth" })).rejects.toThrow();
    await fresh(a);
    expect((await start(a)).ok).toBe(true);
    await expect(new Client(endpoint).joinById(a.room.roomId, { nickname: "Late" })).rejects.toThrow();
  });
  it("requires two connected players and transfers lobby ownership", async () => {
    const a = await host();
    expect((await start(a)).code).toBe("NOT_ENOUGH_PLAYERS");
    const b = await join(a.room.roomId);
    const oldHost = a.view!.selfPlayerId;
    await a.room.leave();
    await waitFor(() => b.view?.members.length === 1 && b.view.hostId !== oldHost);
    expect(b.view!.hostId).toBe(b.view!.selfPlayerId);
  });
  it("keeps hands/stock out of public schema and other players' views", async () => {
    const [a, b] = await pair();
    await start(a);
    const av = await fresh(a); const bv = await fresh(b);
    expect(av.game!.self.hand).toHaveLength(7);
    expect(bv.game!.self.hand).toHaveLength(7);
    const otherIds = bv.game!.self.hand.map(card => card.id);
    expect(av.game!.self.hand.some(card => otherIds.includes(card.id))).toBe(false);
    expect(av.game!.players.every(player => !("hand" in player))).toBe(true);
    await waitFor(() => a.room.state && (a.room.state as { status?: string }).status === "PLAYING");
    const schema = JSON.stringify(a.room.state);
    expect(schema).not.toMatch(/drawPile|handBefore|hadMatchingColor|drawnCardId/);
    for (const card of [...av.game!.self.hand, ...bv.game!.self.hand]) expect(schema).not.toContain(card.id);
  });
  it("rejects out-of-turn, stale-match, malformed and stale-revision requests privately", async () => {
    const [a, b] = await pair(); await start(a);
    await fresh(a); await fresh(b);
    const current = a.view!.game!.currentPlayerId === a.view!.selfPlayerId ? a : b;
    const other = current === a ? b : a;
    const command = { type: "DRAW_CARD" } as const;
    const base = { type: "GAME_COMMAND", matchId: current.view!.matchId!, expectedRevision: 0, command } as const;
    expect((await send(other, base)).code).toBe("NOT_YOUR_TURN");
    expect((await send(current, { ...base, matchId: "old-match" })).code).toBe("STALE_MATCH");
    expect((await send(current, { ...base, expectedRevision: 999 })).code).toBe("STALE_REVISION");
    const oldReplies = other.replies.length;
    current.room.send("action", { requestId: "bad", action: { ...base, playerId: other.view!.selfPlayerId } });
    await waitFor(() => current.replies.find(reply => reply.code === "INVALID_ACTION"));
    expect(other.replies.length).toBe(oldReplies);
  });
  it("deduplicates accepted requests and detects conflicting request IDs", async () => {
    const [a, b] = await pair();
    const action = { type: "START_GAME", expectedRoomRevision: a.view!.revision } as const;
    const reply = await send(a, action, "start-once");
    const again = await send(a, action, "start-once");
    expect(again).toEqual(reply);
    expect((await send(a, { ...action, expectedRoomRevision: 0 }, "start-once")).code).toBe("REQUEST_ID_CONFLICT");
    await fresh(a); await fresh(b);
    expect(a.view!.game!.revision).toBe(0);
  });
  it("pauses on drop, preserves the seat/hand and resumes through a token", async () => {
    const [a, b] = await pair(); await start(a); await fresh(a); await fresh(b);
    const token = b.room.reconnectionToken;
    const playerId = b.view!.selfPlayerId;
    const hand = b.view!.game!.self.hand;
    b.room.connection.close(1000);
    await waitFor(() => a.view?.paused);
    expect((await send(a, { type: "GAME_COMMAND", matchId: a.view!.matchId!, expectedRevision: 0, command: { type: "DRAW_CARD" } })).code).toBe("ROOM_PAUSED");
    const restored = await attach(await new Client(endpoint).reconnect(token));
    guests.push(restored);
    await waitFor(() => a.view && !a.view.paused);
    expect(restored.view!.selfPlayerId).toBe(playerId);
    expect(restored.view!.game!.self.hand).toEqual(hand);
    expect(restored.view!.game!.revision).toBe(0);
    await expect(new Client(endpoint).reconnect(token + "invalid")).rejects.toThrow();
  });
  it("finishes a two-player match after reconnection expires", async () => {
    const [a, b] = await pair(); await start(a); await fresh(a);
    b.room.connection.close(1000);
    await waitFor(() => a.view?.status === "ENDED");
    expect(a.view!.outcome).toMatchObject({ reason: "reconnection-expired", winnerId: a.view!.selfPlayerId });
    expect(a.view!.game).toBeNull();
  });
  it("aborts a larger match on explicit departure; host can rematch survivors", async () => {
    const [a] = await pair(); const c = await join(a.room.roomId); await fresh(a);
    await start(a); await c.room.leave();
    await waitFor(() => a.view?.status === "ENDED");
    expect(a.view!.outcome).toMatchObject({ reason: "player-left", winnerId: null });
    expect((await start(a)).ok).toBe(true);
    expect(a.view!.game!.players).toHaveLength(2);
  });
  it("delivers challenge evidence to exactly the challenger", async () => {
    scenario = "challenge";
    const [a, b] = await pair(); const c = await join(a.room.roomId); await fresh(a);
    await start(a);
    const av = await fresh(a);
    await send(a, { type: "GAME_COMMAND", matchId: av.matchId!, expectedRevision: 0, command: {
      type: "PLAY_CARD", cardId: "four", chosenColor: "green", declareUno: true,
    } });
    await fresh(b);
    const reply = await send(b, { type: "GAME_COMMAND", matchId: b.view!.matchId!, expectedRevision: 1, command: { type: "CHALLENGE_DRAW_FOUR" } });
    expect(reply.ok).toBe(true);
    await waitFor(() => b.events.some(batch => JSON.stringify(batch).includes("CHALLENGE_HAND")));
    await fresh(c);
    expect(JSON.stringify(a.events)).not.toContain("secret-red");
    expect(JSON.stringify(c.events)).not.toContain("secret-red");
    expect(JSON.stringify(b.events)).toContain("secret-red");
  });
  it.each([2, 3, 4])("completes a full %i-client game over WebSockets, then plays again", async count => {
    const a = await host();
    const group = [a];
    for (let i = 1; i < count; i++) group.push(await join(a.room.roomId, "Player " + i));
    await fresh(a);
    expect((await start(a)).ok).toBe(true);
    await Promise.all(group.map(fresh));
    let steps = 0;
    while (a.view!.status === "PLAYING" && steps++ < 1500) {
      const actorId = a.view!.game!.currentPlayerId;
      const actor = group.find(guest => guest.view!.selfPlayerId === actorId)!;
      const view = actor.view!.game!;
      let command: UnoCommand;
      if (view.phase === "choose-color") command = { type: "CHOOSE_COLOR", color: "red" };
      else if (view.phase === "draw-four") command = { type: "ACCEPT_DRAW_FOUR" };
      else {
        const card = view.self.hand.find(card => (view.phase !== "drawn" || card.id === view.self.drawnCardId) &&
          (card.color === null || card.color === view.activeColor ||
            (card.kind === "number" && view.topCard.kind === "number" ? card.value === view.topCard.value :
              card.kind !== "number" && card.kind === view.topCard.kind)));
        command = card ? { type: "PLAY_CARD", cardId: card.id,
          ...(card.color === null ? { chosenColor: "red" as const } : {}), declareUno: view.self.hand.length === 2,
        } : { type: view.phase === "drawn" ? "PASS_TURN" : "DRAW_CARD" };
      }
      const action: RoomAction["action"] = {
        type: "GAME_COMMAND", matchId: actor.view!.matchId!, expectedRevision: view.revision, command,
      };
      await new Promise(resolve => setTimeout(resolve, 25));
      const reply = await send(actor, action);
      expect(reply.ok, JSON.stringify(reply)).toBe(true);
      await waitFor(() => group.every(guest => guest.view!.game!.revision === reply.gameRevision));
    }
    expect(a.view!.status).toBe("ENDED");
    const previous = a.view!.matchId;
    expect((await start(a)).ok).toBe(true);
    expect(a.view!.matchId).not.toBe(previous);
    expect(a.view!.game!.revision).toBe(0);
  }, 90000);
});

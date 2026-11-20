import { randomUUID } from "node:crypto";
import { beforeAll, afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { Client, type Room } from "@colyseus/sdk";
import type { UnoExpandedRoomView, UnoExpandedActionReply, UnoExpandedRoomAction, UnoExpandedGameEvents, UnoExpandedCommand } from "@meepleverse/contracts/uno-expanded";
import { createRealtimeServer } from "../../../src/bootstrap/create-realtime-server.js";
import { fixture, num, black, stock } from "../../unit/uno-expanded/fixtures.js";
import { waitFor } from "./helpers.js";
interface Guest { room: Room; view: UnoExpandedRoomView | null; replies: UnoExpandedActionReply[]; events: UnoExpandedGameEvents[] }
const guests: Guest[] = [];
let runtime: ReturnType<typeof createRealtimeServer>; let endpoint = "";
let scenario: "up" | "battle" | "high-five" = "battle";
const timing = { highFivePrepareMs: 80, highFiveWindowMs: 1000, battleChoiceMs: 2000 };
async function attach(room: Room): Promise<Guest> {
  const guest: Guest = { room, view: null, replies: [], events: [] }; guests.push(guest);
  room.reconnection.enabled = false; room.onError(() => {});
  room.onMessage("room_view", (view: UnoExpandedRoomView) => { guest.view = view; });
  room.onMessage("action_reply", (reply: UnoExpandedActionReply) => guest.replies.push(reply));
  room.onMessage("game_events", (events: UnoExpandedGameEvents) => guest.events.push(events));
  room.send("get_view"); await waitFor(() => guest.view); return guest;
}
async function fresh(guest: Guest) { const previous = guest.view; guest.room.send("get_view"); return waitFor(() => guest.view !== previous ? guest.view : null); }
async function send(guest: Guest, action: UnoExpandedRoomAction["action"], requestId: string = randomUUID()) {
  const old = guest.replies.length; guest.room.send("action", { requestId, action });
  return waitFor(() => guest.replies.slice(old).find(reply => reply.requestId === requestId));
}
async function command(guest: Guest, command: UnoExpandedCommand, revision?: number, requestId?: string) {
  await fresh(guest);
  return send(guest, { type: "GAME_COMMAND", matchId: guest.view!.matchId!, expectedRevision: revision ?? guest.view!.game!.revision, command }, requestId);
}
async function group() {
  const host = await attach(await new Client(endpoint).create("uno-expanded", { nickname: "Host" })); const players = [host];
  for (let i = 1; i < 4; i++) players.push(await attach(await new Client(endpoint).joinById(host.room.roomId, { nickname: "P" + i })));
  await fresh(host); expect((await send(host, { type: "START_GAME", expectedRoomRevision: host.view!.revision })).ok).toBe(true);
  await Promise.all(players.map(fresh)); return players;
}
async function activate(players: Guest[]) {
  const cmd: UnoExpandedCommand = scenario === "battle" ? { type: "PLAY_CARD", cardId: "activation", chosenColor: "red", targetPlayerId: players[1]!.view!.selfPlayerId }
    : scenario === "up" ? { type: "PLAY_CARD", cardId: "activation", chosenColor: "red", declareUno: true }
    : { type: "PLAY_CARD", cardId: "activation", declareUno: true };
  expect((await command(players[0]!, cmd)).ok).toBe(true); await Promise.all(players.map(fresh));
}
beforeAll(async () => {
  runtime = createRealtimeServer({ enableExpandedRooms: true, reconnectSeconds: 3, expandedEffectTiming: timing,
    expandedGameFactory: ids => {
      const hands = scenario === "battle" ? [[black("activation", "wild-battle"), num("secret-a", "red", 9), num("keep-a", "blue"), num("keep-b", "blue"), num("keep-c", "blue")],
        [num("secret-b", "red", 3), num("keep-d", "blue")], [num("third", "green")], [num("fourth", "yellow")]]
        : scenario === "up" ? [[black("activation", "wild-up"), num("a", "blue", 1)], [num("b-two", "red", 2), num("b-keep", "blue", 1)],
          [num("c-three", "blue", 3), num("c-keep", "blue", 1)], [black("d")]]
        : [[{ id: "activation", kind: "high-five" as const, color: "red" as const, value: 5 as const }, num("a")], [num("b")], [num("c")], [num("d")]];
      const game = fixture(hands.slice(0, ids.length), stock(40)); game.players.forEach((player, i) => { player.id = ids[i]!; }); return game;
    } });
  await runtime.server.listen(0, "127.0.0.1"); const address = runtime.httpServer.address();
  if (!address || typeof address === "string") throw new Error("No test address"); endpoint = "http://127.0.0.1:" + address.port;
});
beforeEach(() => { scenario = "battle"; Object.assign(timing, { highFivePrepareMs: 80, highFiveWindowMs: 1000, battleChoiceMs: 2000 }); });
afterEach(async () => { await Promise.all(guests.splice(0).map(async guest => { guest.room.reconnection.enabled = false; if (guest.room.connection.isOpen) await guest.room.leave(); })); });
afterAll(async () => { await runtime?.server.gracefullyShutdown(false); });
describe("Expanded mini-games over real WebSockets", () => {
  it("locks Battle privately, survives reconnect and accepts the opponent's response at the original revision", async () => {
    const players = await group(); const [a, b, c] = players; await activate(players);
    const id = a!.view!.game!.effect!.id; const revision = a!.view!.game!.revision;
    expect((await command(a!, { type: "BATTLE_SELECT", effectId: id, cardId: "secret-a" }, revision)).ok).toBe(true);
    await Promise.all(players.map(fresh));
    for (const observer of [b!, c!, players[3]!]) {
      expect(JSON.stringify(observer.view)).not.toContain('"secret-a"'); expect(JSON.stringify(observer.events)).not.toContain('"secret-a"');
      expect(JSON.stringify(observer.room.state.toJSON())).not.toContain('"secret-a"');
      expect(observer.view!.game!.effect).toMatchObject({ lockedPlayerIds: [a!.view!.selfPlayerId], revealed: [] });
    }
    const token = a!.room.reconnectionToken; a!.room.connection.close(1000); await waitFor(() => b!.view?.paused);
    await fresh(b!); expect(b!.view!.game!.effect).toMatchObject({ deadline: null });
    const restored = await attach(await new Client(endpoint).reconnect(token)); await waitFor(() => !b!.view?.paused);
    expect(restored.view!.game!.self.battle!.selectedCardId).toBe("secret-a");
    expect((await command(b!, { type: "BATTLE_SELECT", effectId: id, cardId: "secret-b", declareUno: true }, revision)).ok).toBe(true);
    await fresh(restored); expect(restored.view!.game!.phase).toBe("battle-discard");
    expect((await command(restored, { type: "BATTLE_DISCARD", effectId: id, cardIds: ["keep-a", "keep-b"], declareUno: true })).ok).toBe(true);
    await fresh(c!); expect(c!.view!.game!.effect).toBeNull(); expect(c!.view!.game!.currentPlayerId).toBe(b!.view!.selfPlayerId);
    await waitFor(() => c!.events.some(batch => batch.events.some(event => event.type === "BATTLE_REVEALED")));
    expect(JSON.stringify(c!.events)).toContain('"secret-a"'); expect(JSON.stringify(c!.events)).toContain('"secret-b"');
    for (const card of stock(40)) expect(JSON.stringify(c!.events)).not.toContain('"' + card.id + '"');
  });
  it("accepts simultaneous Battle locks with one revision and retry never reveals or discards twice", async () => {
    const players = await group(); const [a, b] = players; await activate(players);
    const game = a!.view!.game!; const id = game.effect!.id;
    const actionA: UnoExpandedRoomAction["action"] = { type: "GAME_COMMAND", matchId: a!.view!.matchId!, expectedRevision: game.revision, command: { type: "BATTLE_SELECT", effectId: id, cardId: "secret-a" } };
    const actionB: UnoExpandedRoomAction["action"] = { ...actionA, command: { type: "BATTLE_SELECT", effectId: id, cardId: "secret-b", declareUno: true } };
    const replies = await Promise.all([send(a!, actionA, "lock-a"), send(b!, actionB, "lock-b")]); expect(replies.every(reply => reply.ok)).toBe(true);
    expect(await send(a!, actionA, "lock-a")).toEqual(replies[0]);
    await Promise.all(players.map(fresh));
    for (const guest of players) expect(guest.events.flatMap(batch => batch.events).filter(event => event.type === "BATTLE_REVEALED")).toHaveLength(1);
    expect(a!.view!.game!.revision).toBe(3);
  });
  it("executes missing Battle choices and rewards automatically with real server timers", async () => {
    timing.battleChoiceMs = 100; const players = await group(); await activate(players);
    await waitFor(() => players[0]!.view?.game && players[0]!.view.game.revision >= 3 && players[0]!.view.game.effect === null);
    await Promise.all(players.map(fresh));
    expect(players[0]!.view!.game!.self.hand).toHaveLength(3); expect(players[1]!.view!.game!.self.hand).toHaveLength(5);
    expect(players[0]!.view!.game!.phase).toBe("turn");
    const events = players[0]!.events.flatMap(batch => batch.events);
    expect(events.filter(event => event.type === "EFFECT_TIMEOUT")).toHaveLength(2); expect(events.some(event => event.type === "UNO_CALLED")).toBe(false);
    const revision = players[0]!.view!.game!.revision; await new Promise(resolve => setTimeout(resolve, 150)); await fresh(players[0]!);
    expect(players[0]!.view!.game!.revision).toBe(revision);
  });
  it("accepts High Five peers at one revision and uses server arrival order for the sole penalty", async () => {
    scenario = "high-five"; const players = await group(); await activate(players);
    await waitFor(() => players[0]!.view?.game?.effect?.kind === "high-five" && players[0]!.view.game.effect.stage === "active");
    const effect = players[0]!.view!.game!.effect!; if (effect.kind !== "high-five") throw new Error("Wrong effect");
    const revision = players[0]!.view!.game!.revision;
    const cmd: UnoExpandedCommand = { type: "HIGH_FIVE", effectId: effect.id, attempt: effect.attempt };
    expect((await command(players[1]!, cmd, revision)).ok).toBe(true);
    expect((await command(players[1]!, cmd, revision)).code).toBe("ALREADY_RESPONDED");
    const replies = await Promise.all([command(players[2]!, cmd, revision), command(players[3]!, cmd, revision)]); expect(replies.every(reply => reply.ok)).toBe(true);
    await Promise.all(players.map(fresh));
    const events = players[0]!.events.flatMap(batch => batch.events);
    const responses = events.filter(event => event.type === "HIGH_FIVE_RESPONSE"); const resolved = events.find(event => event.type === "HIGH_FIVE_RESOLVED");
    expect(responses).toHaveLength(3); expect(resolved).toMatchObject({ playerId: responses[2]!.playerId });
    for (const guest of players) expect(guest.view!.game!.self.hand).toHaveLength(guest.view!.selfPlayerId === responses[2]!.playerId ? 3 : 1);
    expect(players[0]!.view!.game!.currentPlayerId).toBe(players[1]!.view!.selfPlayerId);
  });
  it("pauses High Five across a real drop, preserves response order and rejects the old attempt after reconnect", async () => {
    scenario = "high-five"; const players = await group(); await activate(players); const [a, b, c, d] = players;
    await waitFor(() => a!.view?.game?.effect?.kind === "high-five" && a!.view.game.effect.stage === "active");
    const effect = a!.view!.game!.effect!; if (effect.kind !== "high-five") throw new Error("Wrong effect");
    expect((await command(b!, { type: "HIGH_FIVE", effectId: effect.id, attempt: effect.attempt })).ok).toBe(true);
    const token = c!.room.reconnectionToken; c!.room.connection.close(1000); await waitFor(() => a!.view?.paused);
    await fresh(a!); expect(a!.view!.game!.effect).toMatchObject({ deadline: null, responseOrder: [b!.view!.selfPlayerId] });
    await new Promise(resolve => setTimeout(resolve, 1100)); await fresh(a!); expect(a!.view!.game!.phase).toBe("high-five");
    const restored = await attach(await new Client(endpoint).reconnect(token)); await waitFor(() => !a!.view?.paused);
    expect((await command(restored, { type: "HIGH_FIVE", effectId: effect.id, attempt: effect.attempt })).code).toBe("STALE_EFFECT");
    await waitFor(() => restored.view?.game?.effect?.kind === "high-five" && restored.view.game.effect.stage === "active");
    const resumed = restored.view!.game!.effect!; if (resumed.kind !== "high-five") throw new Error("Wrong effect");
    expect(resumed.attempt).toBe(effect.attempt + 1); expect(resumed.responseOrder).toEqual([b!.view!.selfPlayerId]);
    expect((await command(restored, { type: "HIGH_FIVE", effectId: resumed.id, attempt: resumed.attempt })).ok).toBe(true);
    expect((await command(d!, { type: "HIGH_FIVE", effectId: resumed.id, attempt: resumed.attempt })).ok).toBe(true);
    await fresh(d!); expect(d!.view!.game!.self.hand).toHaveLength(3); expect(d!.view!.game!.effect).toBeNull();
  }, 15000);
  it("times out missing High Five responses with exactly one penalty", async () => {
    scenario = "high-five"; timing.highFiveWindowMs = 100; const players = await group(); await activate(players);
    await waitFor(() => players[0]!.view?.game?.phase === "turn" && players[0]!.view.game.revision >= 3);
    await Promise.all(players.map(fresh));
    expect(players[1]!.view!.game!.self.hand).toHaveLength(3);
    for (const guest of [players[0]!, players[2]!, players[3]!]) expect(guest.view!.game!.self.hand).toHaveLength(1);
    expect(players[0]!.events.flatMap(batch => batch.events).filter(event => event.type === "HIGH_FIVE_RESOLVED")).toHaveLength(1);
    const revision = players[0]!.view!.game!.revision;
    await new Promise(resolve => setTimeout(resolve, 150)); await fresh(players[0]!);
    expect(players[0]!.view!.game!.revision).toBe(revision);
  });
  it("cleans a pending High Five timer when leaving and rejects the old match after rematch", async () => {
    scenario = "high-five"; timing.highFiveWindowMs = 300; const players = await group(); await activate(players);
    const oldMatch = players[0]!.view!.matchId!; const oldEffect = players[0]!.view!.game!.effect!;
    await players[0]!.room.leave(); await fresh(players[1]!);
    expect((await send(players[1]!, { type: "START_GAME", expectedRoomRevision: players[1]!.view!.revision })).ok).toBe(true);
    await fresh(players[1]!); const newMatch = players[1]!.view!.matchId!;
    expect(newMatch).not.toBe(oldMatch);
    const reply = await send(players[1]!, { type: "GAME_COMMAND", matchId: oldMatch, expectedRevision: 1,
      command: { type: "HIGH_FIVE", effectId: oldEffect.id, attempt: 1 } });
    expect(reply.code).toBe("STALE_MATCH");
    await new Promise(resolve => setTimeout(resolve, 450)); await fresh(players[1]!);
    expect(players[1]!.view!.matchId).toBe(newMatch);
    expect(players[1]!.view!.game).toMatchObject({ revision: 0, phase: "turn", effect: null });
  });
  it("continues Up across clients and preserves the effect after reconnect", async () => {
    scenario = "up"; const players = await group(); await activate(players); const [a, b, c, d] = players;
    const id = a!.view!.game!.effect!.id;
    const token = b!.room.reconnectionToken; b!.room.connection.close(1000); await waitFor(() => a!.view?.paused);
    const restored = await attach(await new Client(endpoint).reconnect(token)); await waitFor(() => !a!.view?.paused);
    expect(restored.view!.game!.effect!.id).toBe(id);
    expect((await command(restored, { type: "UP_PLAY", effectId: id, cardId: "b-two", declareUno: true })).ok).toBe(true);
    expect((await command(c!, { type: "UP_PLAY", effectId: id, cardId: "c-three", declareUno: true })).ok).toBe(true);
    await Promise.all([fresh(a!), fresh(d!)]);
    expect(d!.view!.game!.self.hand).toHaveLength(4); expect(a!.view!.game!.effect).toBeNull();
    expect(a!.view!.game!.currentPlayerId).toBe(a!.view!.selfPlayerId);
  });
});

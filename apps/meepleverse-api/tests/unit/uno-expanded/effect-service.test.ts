import { describe, expect, it } from "vitest";
import type { UnoExpandedCommand } from "@meepleverse/contracts/uno-expanded";
import { UnoExpandedGameService } from "../../../src/modules/games/uno-expanded/application/services/uno-expanded-game.service.js";
import { fixture, num, black, stock } from "./fixtures.js";
function setup(kind: "battle" | "high-five") {
  let now = 0;
  const service = new UnoExpandedGameService("AB12", ids => {
    const game = kind === "battle" ? fixture([[black("activation", "wild-battle"), num("secret-a", "red", 9), num("keep-a", "blue"), num("keep-b", "blue"), num("keep-c", "blue")],
      [num("secret-b", "red", 3), num("keep-d", "blue")], [num("third")], [num("fourth")]], stock(30))
      : fixture([[{ id: "activation", kind: "high-five", color: "red", value: 5 }, num("keep")], [num("b")], [num("c")], [num("d")]], stock(20));
    game.players = game.players.slice(0, ids.length); game.dealerIndex = ids.length - 1;
    game.players.forEach((player, i) => { player.id = ids[i]!; }); return game;
  }, () => now);
  for (const id of ["a", "b", "c", "d"]) service.add(id, id.toUpperCase());
  service.execute("a", { type: "START_GAME", expectedRoomRevision: service.revision });
  function send(actor: string, command: UnoExpandedCommand, revision = service.game!.revision, matchId = service.matchId!) {
    return service.execute(actor, { type: "GAME_COMMAND", matchId, expectedRevision: revision, command });
  }
  send("a", { type: "PLAY_CARD", cardId: "activation", ...(kind === "battle" ? { chosenColor: "red" as const, targetPlayerId: "b" } : { declareUno: true }) });
  return { service, send, setNow: (value: number) => { now = value; } };
}
describe("mini-game service concurrency and frozen clocks", () => {
  it("accepts both Battle selections at the same expected revision, while keeping reward revision strict", () => {
    const { service: s, send } = setup("battle"); const revision = s.game!.revision; const id = s.game!.effect!.id;
    send("a", { type: "BATTLE_SELECT", effectId: id, cardId: "secret-a" }, revision);
    expect(() => send("b", { type: "BATTLE_SELECT", effectId: id, cardId: "secret-b", declareUno: true }, revision + 50)).toThrow("STALE_REVISION");
    send("b", { type: "BATTLE_SELECT", effectId: id, cardId: "secret-b", declareUno: true }, revision);
    expect(s.game!.phase).toBe("battle-discard");
    expect(() => send("a", { type: "BATTLE_DISCARD", effectId: id, cardIds: ["keep-a", "keep-b"], declareUno: true }, revision)).toThrow("STALE_REVISION");
  });
  it("freezes Battle once across multiple disconnected members and preserves a secret locked choice", () => {
    const { service: s, send, setNow } = setup("battle"); const id = s.game!.effect!.id;
    send("a", { type: "BATTLE_SELECT", effectId: id, cardId: "secret-a" });
    setNow(5000); s.setConnected("c", false); expect(s.nextDeadline).toBeNull();
    expect(s.game!.effect).toMatchObject({ deadline: null, remainingMs: 15000 });
    setNow(8000); s.setConnected("d", false);
    setNow(100000); expect(s.advanceTime()).toBeNull();
    s.setConnected("c", true); expect(s.nextDeadline).toBeNull();
    s.setConnected("d", true); expect(s.nextDeadline).toBe(115000);
    expect(s.view("a").game!.self.battle!.selectedCardId).toBe("secret-a");
    expect(JSON.stringify(s.view("b"))).not.toContain('"secret-a"');
    expect(() => send("a", { type: "BATTLE_SELECT", effectId: id, cardId: "secret-a" })).toThrow("ALREADY_RESPONDED");
    setNow(114999); send("b", { type: "BATTLE_SELECT", effectId: id, cardId: "secret-b", declareUno: true });
    expect(s.game!.phase).toBe("battle-discard"); expect(s.nextDeadline).toBe(134999);
    setNow(120000); s.setConnected("a", false);
    expect(s.game!.effect).toMatchObject({ stage: "reward", remainingMs: 14999, deadline: null });
    setNow(200000); expect(s.advanceTime()).toBeNull(); s.setConnected("a", true);
    expect(s.nextDeadline).toBe(214999);
    send("a", { type: "BATTLE_DISCARD", effectId: id, cardIds: ["keep-a", "keep-b"], declareUno: true });
    expect(s.game!.effect).toBeNull(); expect(s.nextDeadline).toBeNull();
  });
  it("retains High Five response order, opens a fresh attempt after resume and rejects stale clicks", () => {
    const { service: s, send, setNow } = setup("high-five"); const id = s.game!.effect!.id;
    setNow(1500); s.advanceTime(); send("b", { type: "HIGH_FIVE", effectId: id, attempt: 1 });
    setNow(1600); s.setConnected("d", false); expect(s.game!.effect).toMatchObject({ deadline: null, remainingMs: 7900, responseOrder: ["b"] });
    setNow(100000); s.setConnected("d", true);
    expect(s.game!.effect).toMatchObject({ attempt: 2, opensAt: 101500, deadline: 109400, responseOrder: ["b"] });
    expect(() => send("c", { type: "HIGH_FIVE", effectId: id, attempt: 1 })).toThrow("STALE_EFFECT");
    expect(() => send("c", { type: "HIGH_FIVE", effectId: id, attempt: 2 })).toThrow("EFFECT_NOT_OPEN");
    setNow(101500); s.advanceTime(); const revision = s.game!.revision;
    expect(() => send("b", { type: "HIGH_FIVE", effectId: id, attempt: 2 }, revision)).toThrow("ALREADY_RESPONDED");
    send("c", { type: "HIGH_FIVE", effectId: id, attempt: 2 }, revision);
    send("d", { type: "HIGH_FIVE", effectId: id, attempt: 2 }, revision);
    expect(s.game!.players[3]!.hand).toHaveLength(3); expect(s.nextDeadline).toBeNull();
  });
  it("auto-selects and rewards after deadlines, clears abandoned timers and rejects old-match reactions", () => {
    const { service: s, setNow } = setup("battle");
    setNow(20000); expect(s.advanceTime()!.events.public).toContainEqual({ type: "TURN_CHANGED", playerId: "a", phase: "battle-discard" }); expect(s.game!.phase).toBe("battle-discard");
    setNow(40000); expect(s.advanceTime()!.events.public).toContainEqual({ type: "TURN_CHANGED", playerId: "b", phase: "turn" }); expect(s.game!.effect).toBeNull();
    const hf = setup("high-five"); const oldMatch = hf.service.matchId!; const oldId = hf.service.game!.effect!.id;
    hf.service.leave("d", false); expect(hf.service.status).toBe("ENDED"); expect(hf.service.nextDeadline).toBeNull();
    expect(hf.service.advanceTime()).toBeNull();
    hf.service.execute("a", { type: "START_GAME", expectedRoomRevision: hf.service.revision });
    expect(() => hf.send("b", { type: "HIGH_FIVE", effectId: oldId, attempt: 1 }, 0, oldMatch)).toThrow("STALE_MATCH");
  });
});

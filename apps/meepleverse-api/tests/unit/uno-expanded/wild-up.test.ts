import { describe, expect, it } from "vitest";
import { getExpandedPlayerView } from "../../../src/modules/games/uno-expanded/index.js";
import { fixture, num, black, left, stock, conserved } from "./fixtures.js";
import { act, effectId } from "./mini-fixtures.js";
describe("Wild Up", () => {
  it("starts with the selected color, then permits equal or increasing numbers in any color without side effects", () => {
    const game = fixture([[black("up", "wild-up"), num("a", "blue", 3)],
      [{ id: "five", kind: "high-five", color: "red", value: 5 }, num("b", "blue", 1)],
      [left("seven", "yellow"), num("c", "blue", 1)], [num("equal", "blue", 7), num("d", "blue", 1)]], stock(20));
    let next = act(game, "p0", { type: "PLAY_CARD", cardId: "up", chosenColor: "red", declareUno: true }).state;
    const id = effectId(next); expect(next.currentIndex).toBe(1); expect(next.phase).toBe("up");
    expect(getExpandedPlayerView(next, "p1").self.playableCardIds).toEqual(["five"]);
    expect(() => act(next, "p1", { type: "UP_PLAY", effectId: id, cardId: "b", declareUno: true })).toThrow("CARD_NOT_PLAYABLE");
    const five = act(next, "p1", { type: "UP_PLAY", effectId: id, cardId: "five", declareUno: true }); next = five.state;
    expect(five.events.public.some(event => event.type === "EFFECT_STARTED")).toBe(false);
    const seven = act(next, "p2", { type: "UP_PLAY", effectId: id, cardId: "seven", declareUno: true }); next = seven.state;
    expect(seven.events.public.some(event => event.type === "HANDS_PASSED")).toBe(false);
    next = act(next, "p3", { type: "UP_PLAY", effectId: id, cardId: "equal", declareUno: true }).state;
    expect(next.players[0]!.hand).toHaveLength(8); expect(next.currentIndex).toBe(1); expect(next.effect).toBeNull();
    expect(next.activeColor).toBe("blue"); expect(next.direction).toBe(1); conserved(game, next);
  });
  it("allows 9 to answer 9 without an automatic win", () => {
    const game = fixture([[black("up", "wild-up"), num("a")], [num("nine-a", "red", 9), num("b")], [num("nine-b", "blue", 9), num("c")]], stock(20));
    let next = act(game, "p0", { type: "PLAY_CARD", cardId: "up", chosenColor: "red", declareUno: true }).state;
    const id = effectId(next); next = act(next, "p1", { type: "UP_PLAY", effectId: id, cardId: "nine-a", declareUno: true }).state;
    expect(next.phase).toBe("up"); expect(next.currentIndex).toBe(2); expect(getExpandedPlayerView(next, "p2").self.playableCardIds).toEqual(["nine-b"]);
    next = act(next, "p2", { type: "UP_PLAY", effectId: id, cardId: "nine-b", declareUno: true }).state;
    expect(next.phase).toBe("turn"); expect(next.result).toBeNull(); expect(next.players[0]!.hand).toHaveLength(10); conserved(game, next);
  });
  it("automatically draws one if the opening color cannot be answered, and zero after zero", () => {
    const game = fixture([[black("up", "wild-up"), num("a")], [black("b")], [num("c")]], stock(8));
    const failed = act(game, "p0", { type: "PLAY_CARD", cardId: "up", chosenColor: "blue", declareUno: true }).state;
    expect(failed.players[1]!.hand).toHaveLength(2); expect(failed.currentIndex).toBe(2); expect(failed.effect).toBeNull();
    const zero = fixture([[black("up", "wild-up"), num("a")], [num("zero", "red", 0), num("b")], [black("c")]], stock(8));
    let next = act(zero, "p0", { type: "PLAY_CARD", cardId: "up", chosenColor: "red", declareUno: true }).state;
    next = act(next, "p1", { type: "UP_PLAY", effectId: effectId(next), cardId: "zero", declareUno: true }).state;
    expect(next.players[2]!.hand).toHaveLength(1); expect(next.currentIndex).toBe(0); expect(next.effect).toBeNull(); conserved(zero, next);
  });
  it("guards phase, effect ID, actor and UNO; a final numeric response wins immediately", () => {
    const game = fixture([[black("up", "wild-up"), num("a")], [num("only", "red", 7)]], stock(10));
    const next = act(game, "p0", { type: "PLAY_CARD", cardId: "up", chosenColor: "red", declareUno: true }).state;
    expect(() => act(next, "p0", { type: "UP_PLAY", effectId: effectId(next), cardId: "a" })).toThrow("NOT_YOUR_TURN");
    expect(() => act(next, "p1", { type: "UP_PLAY", effectId: "old", cardId: "only" })).toThrow("STALE_EFFECT");
    expect(() => act(next, "p1", { type: "DRAW_CARD" })).toThrow("INVALID_PHASE");
    const result = act(next, "p1", { type: "UP_PLAY", effectId: effectId(next), cardId: "only" }).state;
    expect(result.result!.winnerId).toBe("p1"); expect(result.effect).toBeNull(); conserved(game, result);
  });
  it("penalizes a missing UNO on a response and clamps an unanswerable penalty to available cards", () => {
    const game = fixture([[black("up", "wild-up"), num("a", "blue", 1)], [num("nine", "red", 9), black("keep")]], []);
    const started = act(game, "p0", { type: "PLAY_CARD", cardId: "up", chosenColor: "red", declareUno: true }).state;
    const result = act(started, "p1", { type: "UP_PLAY", effectId: effectId(started), cardId: "nine" });
    expect(result.events.public).toContainEqual({ type: "UNO_PENALTY", playerId: "p1" });
    expect(result.state.effect).toBeNull(); expect(result.state.phase).toBe("turn"); conserved(game, result.state);
  });
});

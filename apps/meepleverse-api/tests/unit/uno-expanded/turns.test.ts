import { describe, expect, it } from "vitest";
import { applyExpandedCommand, getExpandedPlayerView } from "../../../src/modules/games/uno-expanded/index.js";
import { fixture, num, colored, black, stock, step, play, conserved } from "./fixtures.js";
describe("Expanded regular turns", () => {
  it("matches color or pure number, keeps input immutable, and exposes authoritative hints only to the actor", () => {
    const game = fixture([[num("red"), num("five", "blue"), num("bad", "blue", 2)], [num("other")]]);
    expect(getExpandedPlayerView(game, "p0").self.playableCardIds).toEqual(["red", "five"]);
    expect(getExpandedPlayerView(game, "p1").self.playableCardIds).toEqual([]);
    const before = structuredClone(game); const result = play(game, "five");
    expect(game).toEqual(before); expect(result.state.revision).toBe(1); expect(result.state.currentIndex).toBe(1);
    expect(result.state.activeColor).toBe("blue"); conserved(game, result.state);
    expect(() => play(game, "bad")).toThrow("CARD_NOT_PLAYABLE");
  });
  it("validates identity, turn, ownership and the command envelope without side effects", () => {
    const game = fixture([[num("a"), num("b"), num("c")], [num("d")]]); const before = structuredClone(game);
    expect(() => applyExpandedCommand(game, "unknown", { type: "DRAW_CARD" })).toThrow("UNKNOWN_PLAYER");
    expect(() => applyExpandedCommand(game, "p1", { type: "DRAW_CARD" })).toThrow("NOT_YOUR_TURN");
    expect(() => play(game, "d")).toThrow("CARD_NOT_OWNED");
    expect(() => applyExpandedCommand(game, "p0", { type: "DRAW_CARD", playerId: "p1" })).toThrow("INVALID_COMMAND");
    expect(game).toEqual(before);
  });
  it("chooses a Wild color at play time and refuses a second color-selection action", () => {
    const game = fixture([[black("wild"), num("keep")], [num("other")]]);
    expect(() => play(game, "wild")).toThrow("INVALID_COLOR");
    const next = play(game, "wild", { chosenColor: "blue", declareUno: true }).state;
    expect(next.activeColor).toBe("blue"); expect(next.currentIndex).toBe(1);
    expect(() => step(next, { type: "CHOOSE_COLOR", color: "red" })).toThrow("INVALID_PHASE");
  });
  it("restricts play after drawing to the newly drawn card and permits passing", () => {
    const game = fixture([[num("old"), num("keep")], [num("other")]], [num("new", "blue")]);
    const drawn = step(game, { type: "DRAW_CARD" }).state;
    expect(drawn.phase).toBe("drawn"); expect(drawn.drawnCardId).toBe("new");
    expect(getExpandedPlayerView(drawn, "p0").self.playableCardIds).toEqual(["new"]);
    expect(getExpandedPlayerView(drawn, "p1").self.drawnCardId).toBeNull();
    expect(() => play(drawn, "old")).toThrow("DRAWN_CARD_ONLY");
    const passed = step(drawn, { type: "PASS_TURN" }).state;
    expect(passed.currentIndex).toBe(1); expect(passed.drawnCardId).toBeNull();
    expect(play(drawn, "new").state.discardPile.at(-1)!.id).toBe("new");
  });
  it("automatically passes an unplayable draw, including a not-yet-supported special", () => {
    const game = fixture([[num("old")], [num("other")]], [num("unplayable", "blue", 2)]);
    const next = step(game, { type: "DRAW_CARD" }).state;
    expect(next.currentIndex).toBe(1); expect(next.phase).toBe("turn"); expect(next.players[0]!.hand).toHaveLength(2);
  });
  it.each([2, 3, 4])("applies Reverse and Skip correctly with %i seats", count => {
    const hands = [[colored("reverse", "reverse"), colored("skip", "skip"), num("keep")], ...Array.from({ length: count - 1 }, (_, i) => [num("p-" + i)])];
    const game = fixture(hands);
    const reversed = play(game, "reverse").state;
    expect(reversed.direction).toBe(-1); expect(reversed.currentIndex).toBe(count === 2 ? 0 : count - 1);
    expect(play(game, "skip").state.currentIndex).toBe(2 % count);
  });
  it("suggests Up but rejects it without the required color atomically", () => {
    const game = fixture([[black("future", "wild-up"), num("keep")], [num("other")]]);
    expect(getExpandedPlayerView(game, "p0").self.playableCardIds).toContain("future");
    expect(() => play(game, "future", { declareUno: true })).toThrow("INVALID_COLOR");
    expect(game.players[0]!.hand).toHaveLength(2);
  });
  it("automatically penalizes an omitted UNO declaration separately from the opponent's debt", () => {
    const game = fixture([[colored("two", "draw-two"), num("keep")], [num("other")]], stock(10));
    const forgotten = play(game, "two"); const declared = play(game, "two", { declareUno: true });
    expect(forgotten.state.players[0]!.hand).toHaveLength(3); expect(forgotten.state.pendingDraw).toBe(2);
    expect(forgotten.events.public).toContainEqual({ type: "CARDS_DRAWN", playerId: "p0", count: 2, reason: "uno" });
    expect(declared.state.players[0]!.hand).toHaveLength(1); expect(declared.state.pendingDraw).toBe(2);
    conserved(game, forgotten.state);
  });
  it("rejects an irrelevant color, target or UNO declaration before drawing or playing", () => {
    const game = fixture([[num("a"), num("b"), num("c")], [num("other")]], stock(3)); const before = structuredClone(game);
    expect(() => play(game, "a", { chosenColor: "red" })).toThrow("INVALID_COLOR");
    expect(() => play(game, "a", { targetPlayerId: "p1" })).toThrow("INVALID_TARGET");
    expect(() => play(game, "a", { declareUno: true })).toThrow("INVALID_UNO_CALL"); expect(game).toEqual(before);
  });
});

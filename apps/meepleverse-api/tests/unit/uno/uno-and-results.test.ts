import { describe, expect, it } from "vitest";
import { applyCommand } from "../../../src/modules/games/uno/index.js";
import { fixture, number, wild, action } from "./fixtures.js";
describe("UNO declaration and results", () => {
  it("declares atomically only for a two-card hand", () => {
    const game = fixture([[number("play"), number("stay")], [number("other")]]);
    const next = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "play", declareUno: true });
    expect(next.state.players[0]!.hand).toHaveLength(1);
    expect(next.events.public).toContainEqual({ type: "UNO_CALLED", playerId: "p0" });
    expect(next.events.public.some(event => event.type === "UNO_PENALTY")).toBe(false);
    expect(() => applyCommand(fixture([[number("only")], [number("other")]]), "p0", { type: "PLAY_CARD", cardId: "only", declareUno: true })).toThrow("INVALID_UNO_CALL");
  });
  it("automatically draws two exactly once when a declaration is missing", () => {
    const game = fixture([[number("play"), number("stay")], [number("other")]]);
    const next = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "play" });
    expect(next.state.players[0]!.hand).toHaveLength(3);
    expect(next.state.currentIndex).toBe(1);
    expect(next.events.public.filter(event => event.type === "UNO_PENALTY")).toEqual([{ type: "UNO_PENALTY", playerId: "p0" }]);
    expect(next.events.public).toContainEqual({ type: "CARDS_DRAWN", playerId: "p0", count: 2 });
    expect(game.players[0]!.hand).toHaveLength(2);
    expect(() => applyCommand(next.state, "p1", { type: "CATCH_UNO", targetId: "p0" })).toThrow("INVALID_COMMAND");
    expect(() => applyCommand(next.state, "p0", { type: "CALL_UNO" })).toThrow("INVALID_COMMAND");
  });
  it("does not penalize invalid plays or a hand that did not drop from two to one", () => {
    const game = fixture([[number("bad", "blue", 3), number("stay")], [number("other")]]);
    expect(() => applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "bad" })).toThrow("CARD_NOT_PLAYABLE");
    expect(game.players[0]!.hand).toHaveLength(2);
    const next = applyCommand(fixture([[number("a"), number("b"), number("c")], [number("other")]]), "p0", { type: "PLAY_CARD", cardId: "a" });
    expect(next.state.players[0]!.hand).toHaveLength(2);
    expect(next.events.public.some(event => event.type === "UNO_PENALTY")).toBe(false);
  });
  it.each(["skip", "reverse", "draw-two", "wild", "wild-draw-four"] as const)("keeps %s effects when the offender also receives an UNO penalty", kind => {
    const card = kind === "wild" || kind === "wild-draw-four" ? wild("special", kind) : action("special", kind);
    const game = fixture([[card, number("stay")], [number("other")], [number("third")]]);
    const next = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "special", ...(card.kind === "wild" ? { chosenColor: "green" } : {}) });
    expect(next.state.players[0]!.hand).toHaveLength(3);
    expect(next.state.discardPile.at(-1)?.id).toBe("special");
    if (kind === "draw-two") { expect(next.state.players[1]!.hand).toHaveLength(1); expect(next.state.pendingDraw).toBe(2); }
    if (kind === "wild-draw-four") { expect(next.state.phase).toBe("draw-stack"); expect(next.state.pendingDraw).toBe(4); }
    if (kind === "reverse") expect(next.state.direction).toBe(-1);
  });
  it("scores remaining cards and rejects actions after a win", () => {
    const game = fixture([[number("last")], [number("n", "blue", 3), action("s", "skip"), wild("w")]]);
    const next = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "last" }).state;
    expect(next.result).toEqual({ winnerId: "p0", reason: "empty-hand", winnerScore: 73, handPoints: { p0: 0, p1: 73 } });
    expect(() => applyCommand(next, "p1", { type: "DRAW_CARD" })).toThrow("GAME_ENDED");
  });
  it("applies the final Draw Two before scoring", () => {
    const game = fixture([[action("last", "draw-two")], [number("other")]], [number("draw1", "blue", 3), number("draw2", "green", 2)]);
    const next = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "last" }).state;
    expect(next.players[1]!.hand).toHaveLength(3);
    expect(next.result?.winnerScore).toBe(12);
  });
  it("settles a final Draw Four immediately before scoring", () => {
    const game = fixture([[wild("last", "wild-draw-four")], [number("other")]]);
    const next = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "last" }).state;
    expect(next.phase).toBe("ended"); expect(next.result?.winnerId).toBe("p0");
    expect(next.players[1]!.hand).toHaveLength(5);
  });
});

import { describe, expect, it } from "vitest";
import { applyCommand } from "../../../src/modules/games/uno/index.js";
import { fixture, number, action, wild } from "./fixtures.js";
describe("action cards", () => {
  it.each([
    ["skip", 2, 0, 1], ["reverse", 2, 0, -1],
    ["draw-two", 2, 0, 1], ["skip", 3, 2, 1],
    ["reverse", 3, 2, -1], ["draw-two", 3, 2, 1],
    ["reverse", 4, 3, -1],
  ] as const)("%s with %i players", (kind, count, turn, direction) => {
    const game = fixture(Array.from({ length: count }, (_, i) => i === 0 ? [action("action", kind), number("remain")] : [number("p" + i)]));
    const next = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "action" }).state;
    expect(next.currentIndex).toBe(turn);
    expect(next.direction).toBe(direction);
    expect(next.players[1]!.hand).toHaveLength(kind === "draw-two" ? 3 : 1);
  });
  it("requires color for a Wild, then enforces the selected color", () => {
    const game = fixture([[wild("w"), number("stay")], [number("blue", "blue", 4), number("red", "red", 4)]]);
    const next = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "w", chosenColor: "blue" }).state;
    expect(next.activeColor).toBe("blue");
    expect(() => applyCommand(next, "p1", { type: "PLAY_CARD", cardId: "red" })).toThrow("CARD_NOT_PLAYABLE");
    expect(applyCommand(next, "p1", { type: "PLAY_CARD", cardId: "blue" }).state.activeColor).toBe("blue");
  });
  it("lets only the opening player choose color without consuming a turn", () => {
    const game = fixture([[number("a")], [number("b")]]);
    game.phase = "choose-color"; game.activeColor = null; game.discardPile = [wild("top-w")];
    expect(() => applyCommand(game, "p1", { type: "CHOOSE_COLOR", color: "green" })).toThrow("NOT_YOUR_TURN");
    expect(() => applyCommand(game, "p0", { type: "DRAW_CARD" })).toThrow("INVALID_PHASE");
    const next = applyCommand(game, "p0", { type: "CHOOSE_COLOR", color: "green" }).state;
    expect(next.activeColor).toBe("green");
    expect(next.currentIndex).toBe(0);
    expect(next.phase).toBe("turn");
  });
  it("applies Draw Two immediately, so the recipient cannot stack", () => {
    const game = fixture([[action("a", "draw-two"), number("stay")], [action("b", "draw-two")], [number("c")]]);
    const next = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "a" }).state;
    expect(() => applyCommand(next, "p1", { type: "PLAY_CARD", cardId: "b" })).toThrow("NOT_YOUR_TURN");
  });
});

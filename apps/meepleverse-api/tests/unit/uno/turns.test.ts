import { describe, expect, it } from "vitest";
import { applyCommand } from "../../../src/modules/games/uno/index.js";
import { canPlayCard } from "../../../src/modules/games/uno/domain/rules/can-play-card.js";
import { fixture, number, action, wild } from "./fixtures.js";
describe("turns and validation", () => {
  it("matches number, color, symbol and wild", () => {
    expect(canPlayCard(number("a", "blue"), number("top"), "red")).toBe(true);
    expect(canPlayCard(number("a", "blue", 3), number("top"), "red")).toBe(false);
    expect(canPlayCard(action("a", "skip", "blue"), action("top", "skip"), "red")).toBe(true);
    expect(canPlayCard(wild("a"), number("top"), "red")).toBe(true);
  });
  it.each([
    ["p1", { type: "DRAW_CARD" }, "NOT_YOUR_TURN"],
    ["stranger", { type: "DRAW_CARD" }, "UNKNOWN_PLAYER"],
    ["p0", { type: "PLAY_CARD", cardId: "missing" }, "CARD_NOT_OWNED"],
    ["p0", { type: "PLAY_CARD", cardId: "bad" }, "CARD_NOT_PLAYABLE"],
    ["p0", { type: "DRAW_CARD", playerId: "p1" }, "INVALID_COMMAND"],
    ["p0", { type: "PLAY_CARD", cardId: "w", chosenColor: "pink" }, "INVALID_COMMAND"],
    ["p0", { type: "PLAY_CARD", cardId: "w" }, "INVALID_COLOR"],
    ["p0", { type: "PASS_TURN" }, "INVALID_PHASE"],
  ])("rejects invalid action with %s", (actor, payload, error) => {
    const game = fixture([[number("good"), number("bad", "blue", 3), wild("w")], [number("other")]]);
    const before = structuredClone(game);
    expect(() => applyCommand(game, actor as string, payload)).toThrow(error as string);
    expect(game).toEqual(before);
  });
  it("returns new state and increments revision", () => {
    const game = fixture([[number("a"), number("b")], [number("c")]]);
    const next = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "a", declareUno: true }).state;
    expect(game.players[0]!.hand).toHaveLength(2);
    expect(next.players[0]!.hand).toHaveLength(1);
    expect(next.currentIndex).toBe(1);
    expect(next.revision).toBe(1);
  });
  it("only permits the drawn card, with optional pass", () => {
    const game = fixture([[number("old")], [number("other")]], [number("drawn")]);
    const drawn = applyCommand(game, "p0", { type: "DRAW_CARD" }).state;
    expect(drawn.phase).toBe("drawn");
    expect(() => applyCommand(drawn, "p0", { type: "PLAY_CARD", cardId: "old" })).toThrow("DRAWN_CARD_ONLY");
    expect(() => applyCommand(drawn, "p0", { type: "DRAW_CARD" })).toThrow("INVALID_PHASE");
    expect(applyCommand(drawn, "p0", { type: "PASS_TURN" }).state.currentIndex).toBe(1);
    expect(applyCommand(drawn, "p0", { type: "PLAY_CARD", cardId: "drawn" }).state.discardPile.at(-1)!.id).toBe("drawn");
  });
  it("advances automatically for an unplayable draw", () => {
    const game = fixture([[number("a")], [number("b")]], [number("drawn", "blue", 1)]);
    const next = applyCommand(game, "p0", { type: "DRAW_CARD" }).state;
    expect(next.phase).toBe("turn");
    expect(next.currentIndex).toBe(1);
  });
  it("recycles discards, retaining only the top and all physical cards", () => {
    const game = fixture([[number("a")], [number("b")]], []);
    game.discardPile.unshift(number("recycle", "blue", 3));
    const next = applyCommand(game, "p0", { type: "DRAW_CARD" }, () => 0).state;
    expect(next.players[0]!.hand.at(-1)!.id).toBe("recycle");
    expect(next.discardPile.map(card => card.id)).toEqual(["top"]);
  });
  it("aborts after a full cycle with no stock or recyclable cards", () => {
    const game = fixture([[number("a", "blue", 1)], [number("b", "green", 2)]], []);
    const one = applyCommand(game, "p0", { type: "DRAW_CARD" }).state;
    const two = applyCommand(one, "p1", { type: "DRAW_CARD" }).state;
    expect(two.result?.reason).toBe("blocked");
  });
});

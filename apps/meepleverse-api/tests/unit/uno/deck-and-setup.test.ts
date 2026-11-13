import { afterEach, describe, expect, it, vi } from "vitest";
import * as decks from "../../../src/modules/games/uno/domain/rules/create-deck.js";
import { createGame } from "../../../src/modules/games/uno/index.js";
import { shuffle } from "../../../src/modules/games/uno/domain/rules/shuffle.js";
import { orderedDeck, seeded } from "./fixtures.js";
afterEach(() => vi.restoreAllMocks());
describe("deck and setup", () => {
  it("has exactly 108 distinct IDs and classic multiplicities", () => {
    const cards = decks.createDeck();
    expect(cards).toHaveLength(108);
    expect(new Set(cards.map(card => card.id)).size).toBe(108);
    expect(cards.filter(card => card.kind === "number")).toHaveLength(76);
    for (const color of ["red", "yellow", "green", "blue"]) {
      expect(cards.filter(card => card.kind === "number" && card.color === color && card.value === 0)).toHaveLength(1);
      for (let value = 1; value <= 9; value++) expect(cards.filter(card => card.kind === "number" && card.color === color && card.value === value)).toHaveLength(2);
      for (const kind of ["skip", "reverse", "draw-two"]) expect(cards.filter(card => card.color === color && card.kind === kind)).toHaveLength(2);
    }
    expect(cards.filter(card => card.kind === "wild")).toHaveLength(4);
    expect(cards.filter(card => card.kind === "wild-draw-four")).toHaveLength(4);
  });
  it.each([2, 3, 4])("deals and conserves cards for %i players", count => {
    const game = createGame(Array.from({ length: count }, (_, i) => "p" + i), seeded(4));
    expect(game.players.every(player => player.hand.length >= 7)).toBe(true);
    expect(game.drawPile.length + game.discardPile.length + game.players.reduce((sum, p) => sum + p.hand.length, 0)).toBe(108);
    expect(game.discardPile[0]!.kind).not.toBe("wild-draw-four");
  });
  it("is reproducible without mutating the shuffle input", () => {
    const input = [1, 2, 3, 4, 5];
    expect(shuffle(input, seeded(5))).toEqual(shuffle(input, seeded(5)));
    expect(input).toEqual([1, 2, 3, 4, 5]);
    expect(createGame(["a", "b"], seeded(3))).toEqual(createGame(["a", "b"], seeded(3)));
  });
  it.each([[], ["a"], ["a", "a"], ["a", ""], ["a", "b", "c", "d", "e"]])("rejects invalid seats %j", (...ids) => {
    expect(() => createGame(ids as string[])).toThrow("INVALID_SETUP");
  });
  it.each([NaN, 1, -0.1, Infinity])("rejects RNG value %s", value => {
    expect(() => createGame(["a", "b"], () => value)).toThrow("INVALID_RANDOM");
  });
  it.each([
    ["red-1-0", "turn", 1, 1, 7],
    ["red-skip-0", "turn", 0, 1, 7],
    ["red-reverse-0", "turn", 0, -1, 7],
    ["red-draw-two-0", "turn", 0, 1, 9],
    ["wild-0", "choose-color", 1, 1, 7],
  ] as const)("handles opening %s", (id, phase, current, direction, handCount) => {
    const deck = orderedDeck(id);
    vi.spyOn(decks, "createDeck").mockReturnValue(deck);
    const game = createGame(["p0", "p1"], () => 0.999999, 0);
    expect(game.phase).toBe(phase);
    expect(game.currentIndex).toBe(current);
    expect(game.direction).toBe(direction);
    expect(game.players[1]!.hand).toHaveLength(handCount);
  });
  it("returns opening Draw Four to the stock without losing a card", () => {
    const deck = orderedDeck("wild-draw-four-0");
    vi.spyOn(decks, "createDeck").mockReturnValue(deck);
    const game = createGame(["p0", "p1"], () => 0.999999, 0);
    expect(game.discardPile[0]!.kind).not.toBe("wild-draw-four");
    expect(game.drawPile.some(card => card.id === "wild-draw-four-0")).toBe(true);
    expect(game.drawPile.length + 14 + 1).toBe(108);
  });
});

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
    expect(game.players.every(player => player.hand.length === 7)).toBe(true);
    expect(game.drawPile.length + game.discardPile.length + game.players.reduce((sum, p) => sum + p.hand.length, 0)).toBe(108);
    expect(game.discardPile[0]!.kind).toBe("number");
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
  it.each(["red-0", "yellow-1-0", "green-5-0", "blue-9-1"])("opens with number %s and keeps its color and value", id => {
    vi.spyOn(decks, "createDeck").mockReturnValue(orderedDeck(id));
    const game = createGame(["p0", "p1"], () => 0.999999, 0);
    expect(game.discardPile).toEqual([decks.createDeck().find(card => card.id === id)]);
    expect(game.activeColor).toBe(game.discardPile[0]!.color);
    expect(game.currentIndex).toBe(1); expect(game.direction).toBe(1);
    expect(game.phase).toBe("turn"); expect(game.pendingDraw).toBe(0);
    expect(game.players.every(player => player.hand.length === 7)).toBe(true);
  });
  it.each(["red-skip-0", "red-reverse-0", "red-draw-two-0", "wild-0", "wild-draw-four-0"])("returns opening action %s without applying its effect", id => {
    vi.spyOn(decks, "createDeck").mockReturnValue(orderedDeck(id));
    const game = createGame(["p0", "p1"], () => 0.999999, 0);
    expect(game.discardPile[0]!.kind).toBe("number");
    expect(game.drawPile.some(card => card.id === id)).toBe(true);
    expect(game.players.every(player => player.hand.length === 7)).toBe(true);
    expect(game.currentIndex).toBe(1); expect(game.direction).toBe(1);
    expect(game.phase).toBe("turn"); expect(game.pendingDraw).toBe(0);
    expect(game.drawPile).toHaveLength(93);
  });
  it.each([2, 3, 4])("skips consecutive action cards and preserves all 108 identities for %i players", count => {
    const deck = decks.createDeck();
    const skipped = ["red-skip-0", "yellow-reverse-0", "green-draw-two-0", "wild-0", "wild-draw-four-0"];
    const target = deck.length - count * 7 - 1;
    for (const [offset, id] of [...skipped, "blue-0"].entries()) {
      const source = deck.findIndex(card => card.id === id);
      [deck[source], deck[target - offset]] = [deck[target - offset]!, deck[source]!];
    }
    vi.spyOn(decks, "createDeck").mockReturnValue(deck);
    const game = createGame(Array.from({ length: count }, (_, i) => "p" + i), () => 0.999999, 0);
    expect(game.discardPile).toEqual([{ id: "blue-0", kind: "number", color: "blue", value: 0 }]);
    expect(game.activeColor).toBe("blue"); expect(game.pendingDraw).toBe(0);
    expect(game.phase).toBe("turn"); expect(game.currentIndex).toBe(1); expect(game.direction).toBe(1);
    expect(game.players.every(player => player.hand.length === 7)).toBe(true);
    for (const id of skipped) expect(game.drawPile.some(card => card.id === id)).toBe(true);
    const cards = [...game.drawPile, ...game.discardPile, ...game.players.flatMap(player => player.hand)];
    expect(cards).toHaveLength(108); expect(new Set(cards.map(card => card.id)).size).toBe(108);
  });
});

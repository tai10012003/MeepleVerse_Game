import { describe, expect, it } from "vitest";
import { cardPoints, drawFromStock, shuffle } from "../../../src/modules/games/uno-common/index.js";
import { createDeck } from "../../../src/modules/games/uno/domain/rules/create-deck.js";
import { createExpandedDeck } from "../../../src/modules/games/uno-expanded/index.js";
import { seeded } from "../uno/fixtures.js";

function verifyStock<Card extends { id: string }>(deck: Card[]) {
  const top = deck.at(-1)!;
  const piles = { drawPile: deck.slice(0, 2), discardPile: deck.slice(2) };
  const hand: Card[] = [];
  const drawn = drawFromStock(piles, hand, deck.length + 10, cards => shuffle(cards, seeded(19)));
  expect(drawn).toHaveLength(deck.length - 1);
  expect(hand).toEqual(drawn);
  expect(piles.discardPile).toEqual([top]);
  expect(piles.drawPile).toEqual([]);
  expect(new Set([...hand, ...piles.discardPile].map(card => card.id))).toEqual(new Set(deck.map(card => card.id)));
  expect(drawFromStock(piles, hand, 10, cards => [...cards])).toEqual([]);
}

describe("shared UNO stock and default scoring", () => {
  it("draws and recycles 108 cards without taking the visible discard or duplicating IDs", () => verifyStock(createDeck()));
  it("also conserves the 198-card deck without depending on either game's state", () => verifyStock(createExpandedDeck()));
  it("keeps stock order and moves each physical card once across a refill", () => {
    const piles = { drawPile: ["stock"], discardPile: ["old-1", "old-2", "top"] };
    const hand = ["existing"];
    expect(drawFromStock(piles, hand, 3, cards => [...cards])).toEqual(["stock", "old-2", "old-1"]);
    expect(hand).toEqual(["existing", "stock", "old-2", "old-1"]);
    expect(piles.discardPile).toEqual(["top"]);
  });
  it("does not recycle or change a hand when zero cards are requested", () => {
    const piles = { drawPile: [] as string[], discardPile: ["old", "top"] };
    const hand = ["held"];
    expect(drawFromStock(piles, hand, 0, () => { throw new Error("unexpected shuffle"); })).toEqual([]);
    expect(piles).toEqual({ drawPile: [], discardPile: ["old", "top"] });
    expect(hand).toEqual(["held"]);
  });
  it("scores pure numbers by value, colored actions by 20 and wilds by 50 in both decks", () => {
    for (const card of [...createDeck(), ...createExpandedDeck()]) {
      const expected = card.kind === "number" ? card.value : card.color === null ? 50 : 20;
      expect(cardPoints(card), card.id).toBe(expected);
    }
    for (const card of createExpandedDeck().filter(card => card.kind === "high-five" || card.kind.startsWith("seven-change"))) {
      expect(cardPoints(card)).toBe(20);
    }
  });
});

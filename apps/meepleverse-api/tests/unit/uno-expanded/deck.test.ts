import { describe, expect, expectTypeOf, it } from "vitest";
import type { UnoCard } from "@meepleverse/contracts/uno";
import { UNO_COLORS, type UnoExpandedCard } from "@meepleverse/contracts/uno-expanded";
import { createExpandedDeck } from "../../../src/modules/games/uno-expanded/index.js";
import { UNO_EXPANDED_DECK_CONFIG } from "../../../src/modules/games/uno-expanded/domain/constants/deck-config.js";
import { createDeck as createBasicDeck } from "../../../src/modules/games/uno/domain/rules/create-deck.js";

const expectedKinds = [
  ["number", 112], ["skip", 8], ["reverse", 8], ["draw-two", 8], ["wild", 4], ["wild-draw-four", 4],
  ["wild-up", 4], ["wild-battle", 4], ["tornado", 4], ["high-five", 4],
  ["seven-change-left", 2], ["seven-change-right", 2], ["wild-target-four", 4],
  ["wild-multiply-two", 2], ["wild-divide-two", 4], ["wild-shield", 6],
  ["skip-two", 4], ["discard-color", 4], ["wild-discard", 2], ["wild-random", 4],
  ["wild-card-swap", 4], ["wild-draw-six", 2], ["wild-draw-eight", 2],
] as const;
const basicActionKinds = new Set(["skip", "reverse", "draw-two", "wild", "wild-draw-four"]);

describe("UNO expanded deck configuration", () => {
  it("contains exactly 202 physical cards, split into 112 numbers, 32 basic actions and 58 new actions", () => {
    const deck = createExpandedDeck();
    expect(deck).toHaveLength(202);
    expect(deck.filter(card => card.kind === "number")).toHaveLength(112);
    expect(deck.filter(card => basicActionKinds.has(card.kind))).toHaveLength(32);
    expect(deck.filter(card => card.kind !== "number" && !basicActionKinds.has(card.kind))).toHaveLength(58);
    const counts = Object.fromEntries(expectedKinds);
    expect(Object.fromEntries([...new Set(deck.map(card => card.kind))].map(kind => [kind, deck.filter(card => card.kind === kind).length]))).toEqual(counts);
  });

  it("gives every card a nonempty, edition-prefixed unique ID", () => {
    const ids = createExpandedDeck().map(card => card.id);
    expect(ids.every(id => id.startsWith("uno-expanded:") && id.length > "uno-expanded:".length)).toBe(true);
    expect(new Set(ids).size).toBe(202);
    const basicIds = new Set(createBasicDeck().map(card => card.id));
    expect(ids.some(id => basicIds.has(id))).toBe(false);
  });

  it.each(UNO_COLORS)("has the exact number multiplicities and balanced actions in %s", color => {
    const cards = createExpandedDeck().filter(card => card.color === color);
    expect(cards).toHaveLength(39);
    const numbers = cards.filter(card => card.kind === "number");
    expect(numbers).toHaveLength(28);
    for (let value = 0; value <= 9; value++) expect(numbers.filter(card => card.value === value)).toHaveLength(value === 0 ? 1 : 3);
    for (const kind of ["skip", "reverse", "draw-two"]) expect(cards.filter(card => card.kind === kind)).toHaveLength(2);
    for (const kind of ["tornado", "high-five", "skip-two", "discard-color"]) expect(cards.filter(card => card.kind === kind)).toHaveLength(1);
    expect(cards.filter(card => card.kind.startsWith("seven-change-"))).toHaveLength(1);
  });

  it.each(expectedKinds)("has the expected multiplicity for %s (%i copies)", (kind, count) => {
    expect(createExpandedDeck().filter(card => card.kind === kind)).toHaveLength(count);
  });

  it("has exactly 156 colored cards and 46 wild cards, with no colored Wilds", () => {
    const deck = createExpandedDeck();
    expect(deck.filter(card => card.color === null)).toHaveLength(46);
    expect(deck.filter(card => card.color !== null)).toHaveLength(156);
    for (const card of deck) {
      expect(card.color === null).toBe(card.kind.startsWith("wild"));
      if (card.color !== null) expect(UNO_COLORS).toContain(card.color);
    }
  });

  it("keeps the numeric identity of High Five/Seven Change distinct from pure number cards", () => {
    const deck = createExpandedDeck();
    const fives = deck.filter(card => card.kind === "high-five");
    const sevens = deck.filter(card => card.kind === "seven-change-left" || card.kind === "seven-change-right");
    expect(fives).toHaveLength(4); expect(fives.every(card => card.value === 5)).toBe(true);
    expect(sevens).toHaveLength(4); expect(sevens.every(card => card.value === 7)).toBe(true);
    expect(deck.filter(card => "value" in card && card.kind !== "number")).toHaveLength(8);
    expect(deck.filter(card => card.kind === "number" && card.value === 5)).toHaveLength(12);
    expect(deck.filter(card => card.kind === "number" && card.value === 7)).toHaveLength(12);
    expect(deck.filter(card => card.kind === "seven-change-left").map(card => card.color).sort()).toEqual(["red", "yellow"]);
    expect(deck.filter(card => card.kind === "seven-change-right").map(card => card.color).sort()).toEqual(["blue", "green"]);
  });

  it("returns ordered, deterministic IDs and independent arrays/card objects on every call", () => {
    const first = createExpandedDeck(); const second = createExpandedDeck();
    expect(first).toEqual(second); expect(first).not.toBe(second);
    for (let i = 0; i < first.length; i++) expect(first[i]).not.toBe(second[i]);
    first[0]!.id = "changed"; first.pop(); first.reverse();
    expect(second).toEqual(createExpandedDeck());
    expect(second).toHaveLength(202);
  });

  it("freezes recipes so modifying a returned deck cannot change future deck composition", () => {
    expect(Object.isFrozen(UNO_EXPANDED_DECK_CONFIG)).toBe(true);
    for (const entry of UNO_EXPANDED_DECK_CONFIG) {
      expect(Object.isFrozen(entry)).toBe(true); expect(Object.isFrozen(entry.face)).toBe(true);
      expect(Number.isInteger(entry.copies) && entry.copies > 0).toBe(true);
    }
    const entry = UNO_EXPANDED_DECK_CONFIG[0]!;
    expect(Reflect.set(entry, "copies", 0)).toBe(false);
    expect(Reflect.set(entry.face, "color", "blue")).toBe(false);
    expect(createExpandedDeck()).toHaveLength(202);
  });

  it("extends shared card types without widening the Basic contract", () => {
    expectTypeOf<UnoCard>().toExtend<UnoExpandedCard>();
    expectTypeOf<UnoExpandedCard>().not.toExtend<UnoCard>();
    expectTypeOf<Extract<UnoExpandedCard, { kind: "high-five" }>["value"]>().toEqualTypeOf<5>();
    expectTypeOf<Extract<UnoExpandedCard, { kind: "seven-change-left" }>["color"]>().toEqualTypeOf<"red" | "yellow">();
    expectTypeOf<Extract<UnoExpandedCard, { kind: "seven-change-right" }>["value"]>().toEqualTypeOf<7>();
  });

  it("leaves Basic at 108 cards with its original multiplicities after constructing Expanded", () => {
    const before = createBasicDeck();
    const expanded = createExpandedDeck(); expanded[0]!.id = "changed"; expanded.length = 0;
    const after = createBasicDeck();
    expect(after).toEqual(before); expect(after).toHaveLength(108);
    expect(after.filter(card => card.kind === "number")).toHaveLength(76);
    for (const color of UNO_COLORS) {
      expect(after.filter(card => card.kind === "number" && card.color === color && card.value === 0)).toHaveLength(1);
      for (let value = 1; value <= 9; value++) expect(after.filter(card => card.kind === "number" && card.color === color && card.value === value)).toHaveLength(2);
    }
  });
});

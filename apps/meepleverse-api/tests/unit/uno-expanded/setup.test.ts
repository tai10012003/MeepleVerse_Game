import { describe, expect, it } from "vitest";
import { createExpandedGame } from "../../../src/modules/games/uno-expanded/index.js";
import { UnoExpandedRuleError } from "../../../src/modules/games/uno-expanded/domain/errors/uno-expanded.errors.js";
import { createExpandedDeck } from "../../../src/modules/games/uno-expanded/domain/rules/create-deck.js";
import { seeded } from "../uno/fixtures.js";
describe("Expanded preparation", () => {
  it.each([2, 3, 4])("deals seven each, opens with a pure number and conserves 198 identities for %i seats across 100 seeds", count => {
    const ids = Object.freeze(Array.from({ length: count }, (_, i) => "p" + i));
    const expected = createExpandedDeck().map(card => card.id).sort();
    for (let seed = 0; seed < 100; seed++) {
      const game = createExpandedGame(ids, seeded(seed));
      expect(game.phase).toBe("prepared"); expect(game.gameId).toBe("uno-expanded");
      expect(game.players.every(player => player.hand.length === 7)).toBe(true);
      expect(game.drawPile).toHaveLength(198 - count * 7 - 1);
      expect(game.discardPile).toHaveLength(1);
      expect(game.discardPile[0]!.kind).toBe("number");
      expect(game.activeColor).toBe(game.discardPile[0]!.color);
      const all = [...game.drawPile, ...game.discardPile, ...game.players.flatMap(player => player.hand)];
      expect(all.map(card => card.id).sort()).toEqual(expected);
      expect(new Set(all.map(card => card.id)).size).toBe(198);
    }
  });
  it("is deterministic, accepts dealer zero, and creates independent state", () => {
    const a = createExpandedGame(["a", "b"], seeded(12), 0);
    const b = createExpandedGame(["a", "b"], seeded(12), 0);
    expect(a).toEqual(b); expect(a.dealerIndex).toBe(0);
    a.players[0]!.hand.pop(); expect(b.players[0]!.hand).toHaveLength(7);
  });
  it.each([[], ["a"], ["a", "a"], ["a", " "], ["a", "b", "c", "d", "e"]])("rejects invalid seats %j", (...ids) => {
    expect(() => createExpandedGame(ids as string[])).toThrow("INVALID_SETUP");
  });
  it.each([-1, 2, 0.5, NaN])("rejects invalid dealer %s", dealer => {
    expect(() => createExpandedGame(["a", "b"], seeded(2), dealer)).toThrow("INVALID_SETUP");
  });
  it.each([NaN, -0.1, 1, Infinity])("keeps Expanded error identity for invalid RNG %s", value => {
    expect(() => createExpandedGame(["a", "b"], () => value)).toThrow(UnoExpandedRuleError);
    expect(() => createExpandedGame(["a", "b"], () => value, 0)).toThrow("INVALID_RANDOM");
  });
});

import { describe, expect, it } from "vitest";
import { getNextPlayer, randomIndex, shuffle } from "../../../src/modules/games/uno-common/index.js";
import { shuffle as basicShuffle } from "../../../src/modules/games/uno/domain/rules/shuffle.js";
import { UnoRuleError } from "../../../src/modules/games/uno/domain/errors/uno.errors.js";
import { seeded } from "../uno/fixtures.js";

describe("shared UNO mechanics", () => {
  it("shuffles reproducibly without changing the caller's ordered deck", () => {
    const ordered = Object.freeze([1, 2, 3, 4]);
    expect(shuffle(ordered, () => 0)).toEqual([2, 3, 4, 1]);
    expect(shuffle(ordered, seeded(17))).toEqual(shuffle(ordered, seeded(17)));
    expect(ordered).toEqual([1, 2, 3, 4]);
  });
  it.each([NaN, Infinity, -0.01, 1])("rejects invalid randomness %s and preserves Basic's domain error", value => {
    expect(() => randomIndex(4, () => value)).toThrow(RangeError);
    expect(() => basicShuffle([1, 2], () => value)).toThrow(UnoRuleError);
    try { basicShuffle([1, 2], () => value); }
    catch (error) { expect((error as UnoRuleError).code).toBe("INVALID_RANDOM"); }
  });
  it.each([
    [3, 4, 1, 1, 0], [0, 4, -1, 1, 3], [3, 4, 1, 2, 1],
    [0, 4, -1, 2, 2], [1, 2, -1, 2, 1], [0, 4, -1, 9, 3],
  ] as const)("advances seat %i across %i players in direction %i by %i", (index, count, direction, steps, expected) => {
    expect(getNextPlayer(index, count, direction, steps)).toBe(expected);
  });
});

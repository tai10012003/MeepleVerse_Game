import { randomIndex as commonRandomIndex, shuffle as commonShuffle } from "../../../uno-common/index.js";
import type { RandomSource } from "../../../uno-common/index.js";
import { UnoRuleError } from "../errors/uno.errors.js";
export type { RandomSource } from "../../../uno-common/index.js";
const invalidRandom = () => { throw new UnoRuleError("INVALID_RANDOM"); };

// Keep Basic's domain error identity while delegating the mechanics to the shared module.
export function randomIndex(length: number, random: RandomSource): number {
  return commonRandomIndex(length, random, invalidRandom);
}
export function shuffle<T>(items: readonly T[], random: RandomSource): T[] {
  return commonShuffle(items, random, invalidRandom);
}

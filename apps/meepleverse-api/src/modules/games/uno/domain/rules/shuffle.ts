import { requireRule } from "../errors/uno.errors.js";
export type RandomSource = () => number;
export function randomIndex(length: number, random: RandomSource): number {
  const value = random();
  requireRule(Number.isFinite(value) && value >= 0 && value < 1, "INVALID_RANDOM");
  return Math.floor(value * length);
}
export function shuffle<T>(items: readonly T[], random: RandomSource): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1, random);
    const left = result[i]!;
    result[i] = result[j]!;
    result[j] = left;
  }
  return result;
}

export type RandomSource = () => number;
export type InvalidRandomHandler = () => never;
const invalidRandom: InvalidRandomHandler = () => { throw new RangeError("INVALID_RANDOM"); };

export function randomIndex(length: number, random: RandomSource, onInvalid: InvalidRandomHandler = invalidRandom): number {
  const value = random();
  if (!Number.isFinite(value) || value < 0 || value >= 1) return onInvalid();
  return Math.floor(value * length);
}

export function shuffle<T>(items: readonly T[], random: RandomSource, onInvalid: InvalidRandomHandler = invalidRandom): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1, random, onInvalid);
    const left = result[i]!;
    result[i] = result[j]!;
    result[j] = left;
  }
  return result;
}

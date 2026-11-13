export function getNextPlayer(index: number, count: number, direction: 1 | -1, steps = 1): number {
  return ((index + direction * steps) % count + count) % count;
}

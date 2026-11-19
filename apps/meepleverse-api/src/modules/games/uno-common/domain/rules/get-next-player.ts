import type { UnoDirection } from "@meepleverse/contracts/uno-common";

export function getNextPlayer(index: number, count: number, direction: UnoDirection, steps = 1): number {
  return ((index + direction * steps) % count + count) % count;
}

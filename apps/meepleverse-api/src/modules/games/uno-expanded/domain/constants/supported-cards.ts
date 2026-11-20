import type { UnoExpandedCard } from "@meepleverse/contracts/uno-expanded";
export function isSupportedCard(card: UnoExpandedCard): boolean {
  switch (card.kind) {
    case "number": case "skip": case "reverse": case "draw-two": case "wild": case "wild-draw-four":
    case "wild-draw-six": case "wild-draw-eight": case "wild-target-four": case "wild-shield":
    case "tornado": case "wild-random": case "wild-multiply-two": return true;
    default: return false;
  }
}
export function fixedDrawAmount(card: UnoExpandedCard): number {
  switch (card.kind) {
    case "draw-two": return 2;
    case "wild-draw-four": case "wild-target-four": return 4;
    case "wild-draw-six": return 6;
    case "wild-draw-eight": return 8;
    default: return 0;
  }
}

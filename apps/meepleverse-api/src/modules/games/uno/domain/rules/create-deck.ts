import { COLORS, type Card } from "../models/card.js";
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const color of COLORS) {
    deck.push({ id: color + "-0", kind: "number", color, value: 0 });
    for (let value = 1; value <= 9; value++) {
      for (let copy = 0; copy < 2; copy++) {
        deck.push({ id: color + "-" + value + "-" + copy, kind: "number", color, value });
      }
    }
    for (const kind of ["skip", "reverse", "draw-two"] as const) {
      for (let copy = 0; copy < 2; copy++) {
        deck.push({ id: color + "-" + kind + "-" + copy, kind, color });
      }
    }
  }
  for (const kind of ["wild", "wild-draw-four"] as const) {
    for (let copy = 0; copy < 4; copy++) deck.push({ id: kind + "-" + copy, kind, color: null });
  }
  return deck;
}

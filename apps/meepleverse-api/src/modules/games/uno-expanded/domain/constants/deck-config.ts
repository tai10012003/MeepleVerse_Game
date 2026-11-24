import { COLORS, type CardFace } from "../models/card.js";

export interface ExpandedDeckEntry {
  readonly face: Readonly<CardFace>;
  readonly copies: number;
}

// Immutable recipes, not physical cards: each call to createExpandedDeck makes new IDs/objects.
const entries: ExpandedDeckEntry[] = [];
function add(face: CardFace, copies: number) {
  entries.push(Object.freeze({ face: Object.freeze(face), copies }));
}
for (const color of COLORS) {
  add({ kind: "number", color, value: 0 }, 1);
  for (let value = 1; value <= 9; value++) add({ kind: "number", color, value }, 3);
  for (const kind of ["skip", "reverse", "draw-two"] as const) add({ kind, color }, 2);
  for (const kind of ["tornado", "skip-two", "discard-color"] as const) add({ kind, color }, 1);
  add({ kind: "high-five", color, value: 5 }, 1);
  if (color === "red" || color === "yellow") add({ kind: "seven-change-left", color, value: 7 }, 1);
  else add({ kind: "seven-change-right", color, value: 7 }, 1);
}
for (const kind of ["wild", "wild-draw-four"] as const) add({ kind, color: null }, 4);
for (const kind of ["wild-up", "wild-battle", "wild-target-four", "wild-divide-two", "wild-random", "wild-card-swap"] as const) add({ kind, color: null }, 4);
add({ kind: "wild-shield", color: null }, 6);
for (const kind of ["wild-multiply-two", "wild-discard", "wild-draw-six", "wild-draw-eight"] as const) add({ kind, color: null }, 2);

export const UNO_EXPANDED_DECK_CONFIG: readonly ExpandedDeckEntry[] = Object.freeze(entries);

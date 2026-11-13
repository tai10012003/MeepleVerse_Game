import type { Card, Color } from "../models/card.js";
// Draw Four bluffs are accepted; legality is resolved only if challenged.
export function canPlayCard(card: Card, top: Card, activeColor: Color): boolean {
  if (card.color === null) return true;
  if (card.color === activeColor) return true;
  if (card.kind === "number" && top.kind === "number") return card.value === top.value;
  return card.kind !== "number" && card.kind === top.kind;
}

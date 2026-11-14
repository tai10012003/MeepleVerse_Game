import type { Card, Color } from "../models/card.js";
// Wild Draw Four is unrestricted under MeepleVerse stacking rules.
export function canPlayCard(card: Card, top: Card, activeColor: Color): boolean {
  if (card.color === null) return true;
  if (card.color === activeColor) return true;
  if (card.kind === "number" && top.kind === "number") return card.value === top.value;
  return card.kind !== "number" && card.kind === top.kind;
}

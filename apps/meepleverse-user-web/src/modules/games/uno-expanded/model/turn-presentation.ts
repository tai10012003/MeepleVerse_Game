import type { UnoColor, UnoExpandedCard } from "@meepleverse/contracts/uno-expanded";
/** Selection/UNO preview only. The server validates counts and resolves the actual hand change. */
export function remainingAfterPlay(hand: UnoExpandedCard[], card: UnoExpandedCard, color?: UnoColor): number | null {
  const remaining = hand.filter(held => held.id !== card.id);
  if (card.kind === "wild-card-swap") return remaining.length === 0 ? 0 : null;
  if (card.kind === "wild-divide-two") return remaining.length - Math.floor(remaining.length / 2);
  if (card.kind === "wild-discard" && !color) return null;
  if (card.kind === "discard-color" || card.kind === "wild-discard") return remaining.filter(held => held.color !== (card.color ?? color)).length;
  return remaining.length;
}

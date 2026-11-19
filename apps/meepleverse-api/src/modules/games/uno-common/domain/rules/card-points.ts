import type { UnoColor } from "@meepleverse/contracts/uno-common";

/** Default UNO card values. Deciding a winner/result remains the edition's responsibility. */
export function cardPoints(card: { readonly kind: string; readonly color: UnoColor | null; readonly value?: number }): number {
  if (card.kind === "number") {
    if (typeof card.value !== "number") throw new TypeError("A number card requires a numeric value");
    return card.value;
  }
  return card.color === null ? 50 : 20;
}

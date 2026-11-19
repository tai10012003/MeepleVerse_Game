import type { UnoPiles } from "../models/piles.js";

/** Move up to count cards into hand, keeping the top discard when stock is recycled. */
export function drawFromStock<Card>(piles: UnoPiles<Card>, hand: Card[], count: number, shufflePile: (cards: readonly Card[]) => Card[]): Card[] {
  const drawn: Card[] = [];
  for (let i = 0; i < count; i++) {
    if (piles.drawPile.length === 0 && piles.discardPile.length > 1) {
      const top = piles.discardPile.pop()!;
      piles.drawPile = shufflePile(piles.discardPile);
      piles.discardPile = [top];
    }
    const card = piles.drawPile.pop();
    if (!card) break;
    hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

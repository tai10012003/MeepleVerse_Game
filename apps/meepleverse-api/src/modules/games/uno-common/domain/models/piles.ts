/** Only stock/discard storage; no edition-specific phases, players or events. */
export interface UnoPiles<Card> {
  drawPile: Card[];
  discardPile: Card[];
}

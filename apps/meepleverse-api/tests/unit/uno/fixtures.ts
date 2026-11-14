import type { Card, Color } from "../../../src/modules/games/uno/domain/models/card.js";
import type { UnoGame } from "../../../src/modules/games/uno/domain/models/uno-game.js";
import { createDeck } from "../../../src/modules/games/uno/domain/rules/create-deck.js";
export function number(id: string, color: Color = "red", value = 7): Card { return { id, color, kind: "number", value }; }
export function action(id: string, kind: "skip" | "reverse" | "draw-two", color: Color = "red"): Card { return { id, kind, color }; }
export function wild(id: string, kind: "wild" | "wild-draw-four" = "wild"): Card { return { id, kind, color: null }; }
export function fixture(hands: Card[][], stock: Card[] = [number("stock-1"), number("stock-2"), number("stock-3"), number("stock-4"), number("stock-5"), number("stock-6")]): UnoGame {
  return { rulesVersion: "uno-house-v3", revision: 0, phase: "turn",
    players: hands.map((hand, i) => ({ id: "p" + i, hand })),
    dealerIndex: hands.length - 1, currentIndex: 0, direction: 1, activeColor: "red",
    drawPile: stock, discardPile: [number("top")], drawnCardId: null,
    pendingDraw: 0, blockedTurns: 0, result: null };
}
export function seeded(seed: number) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(value, 1664525) + 1013904223) >>> 0; return value / 4294967296; };
}
export function orderedDeck(openingId: string, players = 2): Card[] {
  const cards = createDeck();
  const index = cards.findIndex(card => card.id === openingId);
  const target = cards.length - players * 7 - 1;
  [cards[index], cards[target]] = [cards[target]!, cards[index]!];
  return cards;
}

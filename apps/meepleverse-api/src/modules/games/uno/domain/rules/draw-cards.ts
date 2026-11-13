import type { UnoGame } from "../models/uno-game.js";
import type { UnoEvents } from "../events/uno-event.js";
import type { Card } from "../models/card.js";
import { shuffle, type RandomSource } from "./shuffle.js";
export function drawCards(game: UnoGame, playerId: string, count: number, random: RandomSource, events: UnoEvents): Card[] {
  const player = game.players.find(player => player.id === playerId)!;
  const drawn: Card[] = [];
  for (let i = 0; i < count; i++) {
    if (game.drawPile.length === 0 && game.discardPile.length > 1) {
      const top = game.discardPile.pop()!;
      game.drawPile = shuffle(game.discardPile, random);
      game.discardPile = [top];
    }
    const card = game.drawPile.pop();
    if (!card) break;
    player.hand.push(card);
    drawn.push(card);
  }
  if (player.hand.length !== 1 && game.unoTargetId === playerId) game.unoTargetId = null;
  events.public.push({ type: "CARDS_DRAWN", playerId, count: drawn.length });
  return drawn;
}

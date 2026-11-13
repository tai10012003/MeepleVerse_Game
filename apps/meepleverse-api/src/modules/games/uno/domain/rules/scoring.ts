import type { Card } from "../models/card.js";
import type { UnoGame } from "../models/uno-game.js";
import type { UnoEvents } from "../events/uno-event.js";
export function cardPoints(card: Card): number {
  if (card.kind === "number") return card.value;
  return card.color === null ? 50 : 20;
}
export function endGame(game: UnoGame, winnerId: string | null, events: UnoEvents): void {
  const handPoints = Object.fromEntries(game.players.map(player => [player.id, player.hand.reduce((sum, card) => sum + cardPoints(card), 0)]));
  game.result = {
    winnerId, reason: winnerId ? "empty-hand" : "blocked",
    winnerScore: winnerId ? Object.entries(handPoints).reduce((sum, [id, points]) => sum + (id === winnerId ? 0 : points), 0) : 0,
    handPoints,
  };
  game.phase = "ended";
  game.pendingWinnerId = null;
  game.pendingDrawFour = null;
  game.drawnCardId = null;
  game.unoTargetId = null;
  events.public.push({ type: "GAME_ENDED", winnerId });
}

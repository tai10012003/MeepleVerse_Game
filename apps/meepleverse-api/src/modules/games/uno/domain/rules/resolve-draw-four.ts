import type { UnoGame } from "../models/uno-game.js";
import type { UnoEvents } from "../events/uno-event.js";
import type { RandomSource } from "./shuffle.js";
import { requireRule } from "../errors/uno.errors.js";
import { drawCards } from "./draw-cards.js";
import { getNextPlayer } from "./get-next-player.js";
import { endGame } from "./scoring.js";
export function resolveDrawFour(game: UnoGame, challenged: boolean, random: RandomSource, events: UnoEvents): void {
  requireRule(game.phase === "draw-four" && game.pendingDrawFour, "INVALID_PHASE");
  const pending = game.pendingDrawFour;
  const successful = challenged && pending.hadMatchingColor;
  if (challenged) events.private.push({
    type: "CHALLENGE_HAND", recipientId: pending.challengerId, offenderId: pending.offenderId,
    cards: structuredClone(pending.handBefore),
  });
  drawCards(game, successful ? pending.offenderId : pending.challengerId,
    successful || !challenged ? 4 : 6, random, events);
  if (!successful) game.currentIndex = getNextPlayer(game.currentIndex, game.players.length, game.direction);
  game.pendingDrawFour = null;
  game.phase = "turn";
  events.public.push({ type: "DRAW_FOUR_RESOLVED", challenged, successful });
  const winner = game.pendingWinnerId;
  game.pendingWinnerId = null;
  if (winner && game.players.find(player => player.id === winner)!.hand.length === 0) endGame(game, winner, events);
}

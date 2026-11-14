import type { UnoGame } from "../models/uno-game.js";
import type { UnoEvents } from "../events/uno-event.js";
import { requireRule } from "../errors/uno.errors.js";
import { drawCards } from "./draw-cards.js";
import { getNextPlayer } from "./get-next-player.js";
import type { RandomSource } from "./shuffle.js";
export function acceptDrawPenalty(game: UnoGame, actorId: string, random: RandomSource, events: UnoEvents): void {
  requireRule(game.phase === "draw-stack" && game.pendingDraw > 0, "INVALID_PHASE");
  const count = game.pendingDraw;
  drawCards(game, actorId, count, random, events);
  events.public.push({ type: "DRAW_PENALTY_ACCEPTED", playerId: actorId, count });
  game.pendingDraw = 0;
  game.drawnCardId = null;
  game.blockedTurns = 0;
  if (game.discardPile.at(-1)!.kind === "wild-draw-four") {
    // Only penalty cards can extend a chain, so its final author is the previous seat.
    game.currentIndex = getNextPlayer(game.currentIndex, game.players.length, game.direction === 1 ? -1 : 1);
    game.phase = "penalty-color";
  }
  else {
    game.phase = "turn";
    game.currentIndex = getNextPlayer(game.currentIndex, game.players.length, game.direction);
  }
}

import { getNextPlayer, type RandomSource } from "../../../uno-common/index.js";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import type { UnoExpandedEvents } from "../events/uno-expanded-events.js";
import { requireExpanded } from "../errors/uno-expanded.errors.js";
import { drawExpandedCards } from "./draw-cards.js";
export function acceptExpandedDrawPenalty(game: UnoExpandedGame, actorId: string, random: RandomSource, events: UnoExpandedEvents): void {
  requireExpanded(game.phase === "draw-stack" && game.pendingDraw > 0, "INVALID_PHASE");
  const requestedCount = game.pendingDraw;
  const drawn = drawExpandedCards(game, actorId, requestedCount, random, events, "stack");
  events.public.push({ type: "DRAW_PENALTY_ACCEPTED", playerId: actorId, requestedCount, count: drawn.length });
  game.pendingDraw = 0; game.drawnCardId = null; game.blockedTurns = 0; game.phase = "turn";
  game.currentIndex = getNextPlayer(game.currentIndex, game.players.length, game.direction);
}

import { cardPoints } from "../../../uno-common/index.js";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import type { UnoExpandedEvents } from "../events/uno-expanded-events.js";
export function endExpandedGame(game: UnoExpandedGame, winnerId: string | null, events: UnoExpandedEvents): void {
  const handPoints = Object.fromEntries(game.players.map(player => [player.id, player.hand.reduce((sum, card) => sum + cardPoints(card), 0)]));
  game.result = { winnerId, reason: winnerId ? "empty-hand" : "blocked", handPoints,
    winnerScore: winnerId ? Object.entries(handPoints).reduce((sum, [id, points]) => sum + (id === winnerId ? 0 : points), 0) : 0 };
  game.phase = "ended"; game.pendingDraw = 0; game.drawnCardId = null;
  events.public.push({ type: "GAME_ENDED", winnerId });
}

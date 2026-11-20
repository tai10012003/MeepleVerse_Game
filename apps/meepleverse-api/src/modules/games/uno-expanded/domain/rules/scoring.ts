import type { UnoExpandedResult } from "@meepleverse/contracts/uno-expanded";
import { cardPoints } from "../../../uno-common/index.js";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import type { UnoExpandedEvents } from "../events/uno-expanded-events.js";
export function endExpandedGame(game: UnoExpandedGame, winnerId: string | null, events: UnoExpandedEvents, reason: UnoExpandedResult["reason"] = winnerId ? "empty-hand" : "blocked"): void {
  const handPoints = Object.fromEntries(game.players.map(player => [player.id, player.hand.reduce((sum, card) => sum + cardPoints(card), 0)]));
  game.result = { winnerId, reason, handPoints,
    winnerScore: winnerId ? Object.entries(handPoints).reduce((sum, [id, points]) => sum + (id === winnerId ? 0 : points), 0) : 0 };
  game.effect = null; game.phase = "ended"; game.pendingDraw = 0; game.drawnCardId = null;
  events.public.push({ type: "GAME_ENDED", winnerId });
}

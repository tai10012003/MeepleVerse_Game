import type { UnoExpandedView } from "@meepleverse/contracts/uno-expanded";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import { requireExpanded } from "../errors/uno-expanded.errors.js";
export function getExpandedPlayerView(game: UnoExpandedGame, playerId: string): UnoExpandedView {
  const player = game.players.find(player => player.id === playerId);
  requireExpanded(player, "UNKNOWN_PLAYER");
  const top = game.discardPile.at(-1);
  requireExpanded(top?.kind === "number", "INVALID_SETUP");
  return structuredClone({ gameId: game.gameId, rulesVersion: game.rulesVersion, revision: game.revision, phase: game.phase,
    players: game.players.map(player => ({ playerId: player.id, handCount: player.hand.length })),
    dealerId: game.players[game.dealerIndex]!.id, currentPlayerId: null, direction: game.direction, activeColor: game.activeColor,
    topCard: top, discardCards: game.discardPile.slice(-8), drawPileCount: game.drawPile.length,
    discardPileCount: game.discardPile.length, self: { playerId, hand: player.hand } });
}

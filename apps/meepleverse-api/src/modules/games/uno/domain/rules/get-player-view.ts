import type { UnoView } from "@meepleverse/contracts/uno";
import type { UnoGame } from "../models/uno-game.js";
import { requireRule } from "../errors/uno.errors.js";
export function getPlayerView(game: UnoGame, playerId: string): UnoView {
  const player = game.players.find(player => player.id === playerId);
  requireRule(player, "UNKNOWN_PLAYER");
  return structuredClone({
    rulesVersion: game.rulesVersion, revision: game.revision, phase: game.phase,
    players: game.players.map(player => ({ playerId: player.id, handCount: player.hand.length })),
    currentPlayerId: game.phase === "ended" ? null : game.players[game.currentIndex]!.id,
    direction: game.direction, activeColor: game.activeColor, topCard: game.discardPile.at(-1)!,
    drawPileCount: game.drawPile.length, discardPileCount: game.discardPile.length,
    unoTargetId: game.unoTargetId,
    pendingDrawFour: game.pendingDrawFour ? {
      offenderId: game.pendingDrawFour.offenderId, challengerId: game.pendingDrawFour.challengerId,
    } : null,
    result: game.result,
    self: { playerId, hand: player.hand, drawnCardId: game.players[game.currentIndex]!.id === playerId ? game.drawnCardId : null },
  });
}

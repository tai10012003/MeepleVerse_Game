import type { UnoExpandedCard } from "@meepleverse/contracts/uno-expanded";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import { fixedDrawAmount, isSupportedCard } from "../constants/supported-cards.js";
export function canPlayExpandedCard(game: UnoExpandedGame, card: UnoExpandedCard): boolean {
  if (!isSupportedCard(card) || game.phase === "ended") return false;
  if (game.phase === "drawn" && card.id !== game.drawnCardId) return false;
  const top = game.discardPile.at(-1)!;
  if (game.phase === "draw-stack") {
    return card.kind === "wild-shield" || (fixedDrawAmount(card) > 0 && !(top.kind === "wild-shield" && card.kind === "draw-two"));
  }
  return card.color === null || card.color === game.activeColor ||
    (("value" in card && "value" in top && card.value === top.value) || (card.kind !== "number" && card.kind === top.kind));
}
export function playableExpandedCardIds(game: UnoExpandedGame, playerId: string): string[] {
  if (game.phase === "ended" || game.players[game.currentIndex]!.id !== playerId) return [];
  return game.players[game.currentIndex]!.hand.filter(card => canPlayExpandedCard(game, card)).map(card => card.id);
}

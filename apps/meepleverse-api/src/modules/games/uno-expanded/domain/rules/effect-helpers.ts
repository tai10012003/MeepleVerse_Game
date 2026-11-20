import type { UnoExpandedCard } from "@meepleverse/contracts/uno-expanded";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import { requireExpanded } from "../errors/uno-expanded.errors.js";
export function numericValue(card: UnoExpandedCard): number | null { return "value" in card ? card.value : null; }
export function nextEffectId(game: UnoExpandedGame): string { return "effect-" + (++game.effectSequence); }
export function requireEffect(game: UnoExpandedGame, effectId: string): void {
  requireExpanded(game.effect?.id === effectId, "STALE_EFFECT");
}
export function finishEffect(game: UnoExpandedGame, resumeIndex: number): void {
  game.effect = null; game.phase = "turn"; game.currentIndex = resumeIndex;
  game.drawnCardId = null; game.blockedTurns = 0;
}

import type { UnoExpandedEffectView, UnoExpandedOwnBattle } from "./effects.js";
import type { UnoExpandedCard } from "./card.js";
import type { UnoColor, UnoDirection } from "../uno-common/card.js";
export const UNO_EXPANDED_PHASES = ["turn", "drawn", "draw-stack", "up", "battle-select", "battle-discard", "high-five", "ended"] as const;
export type UnoExpandedPhase = typeof UNO_EXPANDED_PHASES[number];
export interface UnoExpandedResult {
  winnerId: string | null;
  reason: "empty-hand" | "blocked" | "simultaneous-finish";
  winnerScore: number;
  handPoints: Record<string, number>;
}
export interface UnoExpandedView {
  gameId: "uno-expanded";
  rulesVersion: "uno-expanded-v2";
  revision: number;
  phase: UnoExpandedPhase;
  players: Array<{ playerId: string; handCount: number }>;
  dealerId: string;
  currentPlayerId: string | null;
  direction: UnoDirection;
  activeColor: UnoColor;
  topCard: UnoExpandedCard;
  discardCards: UnoExpandedCard[];
  drawPileCount: number;
  discardPileCount: number;
  pendingDraw: number;
  result: UnoExpandedResult | null;
  effect: UnoExpandedEffectView | null;
  self: { playerId: string; hand: UnoExpandedCard[]; drawnCardId: string | null; playableCardIds: string[]; battle: UnoExpandedOwnBattle | null };
}

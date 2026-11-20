import type { UnoExpandedCard } from "./card.js";
import type { UnoColor, UnoDirection } from "../uno-common/card.js";
export const UNO_EXPANDED_PHASES = ["turn", "drawn", "draw-stack", "ended"] as const;
export type UnoExpandedPhase = typeof UNO_EXPANDED_PHASES[number];
export interface UnoExpandedResult {
  winnerId: string | null;
  reason: "empty-hand" | "blocked";
  winnerScore: number;
  handPoints: Record<string, number>;
}
export interface UnoExpandedView {
  gameId: "uno-expanded";
  rulesVersion: "uno-expanded-v1";
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
  self: { playerId: string; hand: UnoExpandedCard[]; drawnCardId: string | null; playableCardIds: string[] };
}

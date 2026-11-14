import type { UnoCard, UnoColor } from "./card.js";
export type UnoPhase = "turn" | "drawn" | "choose-color" | "draw-stack" | "penalty-color" | "ended";
export interface UnoResult {
  winnerId: string | null;
  reason: "empty-hand" | "blocked";
  winnerScore: number;
  handPoints: Record<string, number>;
}
export interface UnoPlayerView {
  playerId: string;
  handCount: number;
}
export interface UnoView {
  rulesVersion: "uno-house-v3";
  revision: number;
  phase: UnoPhase;
  players: UnoPlayerView[];
  currentPlayerId: string | null;
  direction: 1 | -1;
  activeColor: UnoColor | null;
  topCard: UnoCard;
  /** Public, oldest to newest; limited to the eight most recent discards. */
  discardCards: UnoCard[];
  drawPileCount: number;
  discardPileCount: number;
  pendingDraw: number;
  result: UnoResult | null;
  self: { playerId: string; hand: UnoCard[]; drawnCardId: string | null };
}

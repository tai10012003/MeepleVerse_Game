import type { UnoCard, UnoColor } from "./card.js";
export type UnoPhase = "turn" | "drawn" | "choose-color" | "draw-four" | "ended";
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
  rulesVersion: "uno-basic-v1";
  revision: number;
  phase: UnoPhase;
  players: UnoPlayerView[];
  currentPlayerId: string | null;
  direction: 1 | -1;
  activeColor: UnoColor | null;
  topCard: UnoCard;
  drawPileCount: number;
  discardPileCount: number;
  unoTargetId: string | null;
  pendingDrawFour: { offenderId: string; challengerId: string } | null;
  result: UnoResult | null;
  self: { playerId: string; hand: UnoCard[]; drawnCardId: string | null };
}

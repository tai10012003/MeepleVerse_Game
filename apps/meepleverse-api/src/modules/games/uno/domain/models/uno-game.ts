import type { UnoPhase, UnoResult } from "@meepleverse/contracts/uno";
import type { Card, Color } from "./card.js";
export interface Player { id: string; hand: Card[] }
export interface UnoGame {
  rulesVersion: "uno-house-v3";
  revision: number;
  phase: UnoPhase;
  players: Player[];
  dealerIndex: number;
  currentIndex: number;
  direction: 1 | -1;
  activeColor: Color | null;
  drawPile: Card[];
  discardPile: Card[];
  drawnCardId: string | null;
  pendingDraw: number;
  blockedTurns: number;
  result: UnoResult | null;
}

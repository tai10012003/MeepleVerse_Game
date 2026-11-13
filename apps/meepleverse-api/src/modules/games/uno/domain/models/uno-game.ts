import type { UnoPhase, UnoResult } from "@meepleverse/contracts/uno";
import type { Card, Color } from "./card.js";
export interface Player { id: string; hand: Card[] }
export interface DrawFour {
  offenderId: string;
  challengerId: string;
  hadMatchingColor: boolean;
  handBefore: Card[];
}
export interface UnoGame {
  rulesVersion: "uno-basic-v1";
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
  unoTargetId: string | null;
  pendingDrawFour: DrawFour | null;
  pendingWinnerId: string | null;
  blockedTurns: number;
  result: UnoResult | null;
}

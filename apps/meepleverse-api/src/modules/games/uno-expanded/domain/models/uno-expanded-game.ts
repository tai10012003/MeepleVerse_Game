import type { ExpandedEffect } from "./effects.js";
import type { UnoExpandedCard, UnoColor, UnoExpandedPhase, UnoExpandedResult } from "@meepleverse/contracts/uno-expanded";
import type { UnoDirection } from "@meepleverse/contracts/uno-common";
export interface UnoExpandedGame {
  gameId: "uno-expanded";
  rulesVersion: "uno-expanded-v2";
  revision: number;
  phase: UnoExpandedPhase;
  players: Array<{ id: string; hand: UnoExpandedCard[] }>;
  dealerIndex: number;
  currentIndex: number;
  direction: UnoDirection;
  activeColor: UnoColor;
  drawPile: UnoExpandedCard[];
  discardPile: UnoExpandedCard[];
  drawnCardId: string | null;
  pendingDraw: number;
  blockedTurns: number;
  result: UnoExpandedResult | null;
  effectSequence: number;
  effect: ExpandedEffect | null;
}

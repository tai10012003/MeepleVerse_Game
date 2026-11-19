import type { UnoExpandedCard, UnoColor } from "@meepleverse/contracts/uno-expanded";
import type { UnoDirection } from "@meepleverse/contracts/uno-common";
export interface UnoExpandedGame {
  gameId: "uno-expanded";
  rulesVersion: "uno-expanded-v1";
  revision: number;
  phase: "prepared";
  players: Array<{ id: string; hand: UnoExpandedCard[] }>;
  dealerIndex: number;
  direction: UnoDirection;
  activeColor: UnoColor;
  drawPile: UnoExpandedCard[];
  discardPile: UnoExpandedCard[];
}

import type { UnoExpandedCard } from "./card.js";
import type { UnoColor, UnoDirection } from "../uno-common/card.js";
/** Foundation only: no playable turn or special-effect phase is enabled yet. */
export interface UnoExpandedView {
  gameId: "uno-expanded";
  rulesVersion: "uno-expanded-v1";
  revision: number;
  phase: "prepared";
  players: Array<{ playerId: string; handCount: number }>;
  dealerId: string;
  currentPlayerId: null;
  direction: UnoDirection;
  activeColor: UnoColor;
  topCard: Extract<UnoExpandedCard, { kind: "number" }>;
  discardCards: UnoExpandedCard[];
  drawPileCount: number;
  discardPileCount: number;
  self: { playerId: string; hand: UnoExpandedCard[] };
}

import type { UnoExpandedCard } from "./card.js";
import type { UnoColor } from "../uno-common/card.js";
export interface BattleRevealedCard { playerId: string; card: UnoExpandedCard }
export type UnoExpandedEffectView =
  | { kind: "up"; id: string; actorId: string; openingColor: UnoColor; lastValue: number | null }
  | { kind: "battle"; id: string; actorId: string; targetId: string; color: UnoColor; stage: "select" | "reward";
      deadline: number | null; remainingMs: number | null; lockedPlayerIds: string[]; winnerId: string | null; revealed: BattleRevealedCard[] }
  | { kind: "high-five"; id: string; actorId: string; stage: "preparing" | "active"; attempt: number;
      opensAt: number | null; deadline: number | null; remainingMs: number | null; eligiblePlayerIds: string[]; responseOrder: string[] };
export interface UnoExpandedOwnBattle {
  eligibleCardIds: string[];
  selectedCardId: string | null;
  selectedDeclareUno: boolean | null;
  rewardCount: number;
}

import type { UnoColor, BattleRevealedCard } from "@meepleverse/contracts/uno-expanded";
interface EffectBase { id: string; actorId: string; resumeIndex: number }
interface TimedEffect { deadline: number | null; remainingMs: number | null }
export interface UpEffect extends EffectBase { kind: "up"; openingColor: UnoColor; lastValue: number | null }
export interface BattleChoice { playerId: string; cardId: string; declareUno: boolean }
export interface BattleEffect extends EffectBase, TimedEffect {
  kind: "battle"; targetId: string; color: UnoColor; anchorCardId: string; stage: "select" | "reward";
  eligiblePlayerIds: string[]; choices: BattleChoice[]; revealed: BattleRevealedCard[];
  winnerId: string | null; rewardCount: number;
}
export interface HighFiveEffect extends EffectBase, TimedEffect {
  kind: "high-five"; stage: "preparing" | "active"; attempt: number; opensAt: number | null;
  eligiblePlayerIds: string[]; responseOrder: string[];
}
export type ExpandedEffect = UpEffect | BattleEffect | HighFiveEffect;

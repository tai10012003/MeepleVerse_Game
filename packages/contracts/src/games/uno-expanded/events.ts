import type { BattleRevealedCard } from "./effects.js";
import type { UnoExpandedCard } from "./card.js";
import type { UnoColor } from "../uno-common/card.js";
import type { UnoExpandedPhase } from "./state.js";
export type UnoExpandedDrawReason = "draw" | "uno" | "stack" | "tornado" | "random-reveal" | "random-extra" | "multiply" | "up" | "battle" | "high-five";
export type UnoExpandedEvent =
  | { type: "GAME_STARTED"; playerCount: number; openingCardId: string }
  | { type: "CARD_PLAYED"; playerId: string; card: UnoExpandedCard }
  | { type: "COLOR_CHOSEN"; playerId: string; color: UnoColor }
  | { type: "UNO_CALLED" | "UNO_PENALTY"; playerId: string }
  | { type: "CARDS_DRAWN"; playerId: string; count: number; reason: UnoExpandedDrawReason }
  | { type: "PENALTY_UPDATED"; playerId: string; count: number }
  | { type: "DRAW_PENALTY_ACCEPTED"; playerId: string; requestedCount: number; count: number }
  | { type: "TORNADO_REVEALED"; playerId: string; color: UnoColor; cards: UnoExpandedCard[] }
  | { type: "RANDOM_REVEALED"; playerId: string; card: UnoExpandedCard }
  | { type: "DRAW_EFFECT_RESOLVED"; playerId: string; actorId: string; kind: "tornado" | "wild-random" | "wild-multiply-two"; count: number }
  | { type: "COLOR_DISCARDED"; playerId: string; color: UnoColor; cards: UnoExpandedCard[] }
  | { type: "HAND_REDUCED"; playerId: string; count: number }
  | { type: "HANDS_SWAPPED"; playerId: string; targetPlayerId: string; playerHandCount: number; targetHandCount: number }
  | { type: "HANDS_PASSED"; playerId: string; direction: 1 | -1; transfers: Array<{ fromPlayerId: string; toPlayerId: string; count: number }> }
  | { type: "EFFECT_STARTED"; effectId: string; kind: "up" | "battle" | "high-five"; actorId: string }
  | { type: "EFFECT_OPENED"; effectId: string; attempt: number }
  | { type: "EFFECT_TIMEOUT"; effectId: string; stage: "select" | "reward" | "high-five" }
  | { type: "UP_ENDED"; effectId: string; playerId: string; count: number }
  | { type: "BATTLE_REVEALED"; effectId: string; cards: BattleRevealedCard[]; winnerId: string | null }
  | { type: "BATTLE_REWARD_DISCARDED"; effectId: string; playerId: string; cards: UnoExpandedCard[] }
  | { type: "BATTLE_RESOLVED"; effectId: string; winnerId: string | null }
  | { type: "HIGH_FIVE_RESPONSE"; effectId: string; attempt: number; playerId: string; rank: number }
  | { type: "HIGH_FIVE_RESOLVED"; effectId: string; playerId: string; count: number }
  | { type: "TURN_CHANGED"; playerId: string; phase: UnoExpandedPhase }
  | { type: "GAME_ENDED"; winnerId: string | null };

import type { UnoExpandedCard } from "./card.js";
import type { UnoColor } from "../uno-common/card.js";
import type { UnoExpandedPhase } from "./state.js";
export type UnoExpandedDrawReason = "draw" | "uno" | "stack" | "tornado" | "random-reveal" | "random-extra" | "multiply";
export type UnoExpandedEvent =
  | { type: "GAME_STARTED"; playerCount: number; openingCardId: string }
  | { type: "CARD_PLAYED"; playerId: string; card: UnoExpandedCard }
  | { type: "COLOR_CHOSEN"; playerId: string; color: UnoColor }
  | { type: "UNO_CALLED" | "UNO_PENALTY"; playerId: string }
  | { type: "CARDS_DRAWN"; playerId: string; count: number; reason: UnoExpandedDrawReason }
  | { type: "PENALTY_UPDATED"; playerId: string; count: number }
  | { type: "DRAW_PENALTY_ACCEPTED"; playerId: string; requestedCount: number; count: number }
  | { type: "RANDOM_REVEALED"; playerId: string; card: UnoExpandedCard }
  | { type: "DRAW_EFFECT_RESOLVED"; playerId: string; actorId: string; kind: "tornado" | "wild-random" | "wild-multiply-two"; count: number }
  | { type: "TURN_CHANGED"; playerId: string; phase: UnoExpandedPhase }
  | { type: "GAME_ENDED"; winnerId: string | null };

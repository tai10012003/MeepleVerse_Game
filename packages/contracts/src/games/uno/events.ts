import type { UnoCard } from "./card.js";
export type UnoEvent =
  | { type: "CARD_PLAYED"; playerId: string; card: UnoCard }
  | { type: "CARDS_DRAWN"; playerId: string; count: number }
  | { type: "UNO_CALLED"; playerId: string }
  | { type: "UNO_CAUGHT"; playerId: string; caughtBy: string }
  | { type: "DRAW_FOUR_RESOLVED"; challenged: boolean; successful: boolean }
  | { type: "GAME_ENDED"; winnerId: string | null };
export interface PrivateUnoEvent {
  type: "CHALLENGE_HAND"; recipientId: string; offenderId: string; cards: UnoCard[];
}

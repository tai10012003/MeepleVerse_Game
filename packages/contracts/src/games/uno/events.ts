import type { UnoCard } from "./card.js";
export type UnoEvent =
  | { type: "CARD_PLAYED"; playerId: string; card: UnoCard }
  | { type: "CARDS_DRAWN"; playerId: string; count: number }
  | { type: "UNO_CALLED"; playerId: string }
  | { type: "UNO_PENALTY"; playerId: string }
  | { type: "DRAW_PENALTY_ACCEPTED"; playerId: string; count: number }
  | { type: "COLOR_CHOSEN"; playerId: string; color: import("./card.js").UnoColor }
  | { type: "GAME_ENDED"; winnerId: string | null };

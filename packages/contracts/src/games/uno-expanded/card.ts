import type { UnoStandardCard, UnoColor } from "../uno-common/card.js";

export type UnoExpandedCard =
  | { id: string; kind: "wild-card-swap"; color: null }
  | UnoStandardCard
  | { id: string; kind: "tornado" | "skip-two" | "discard-color"; color: UnoColor }
  | { id: string; kind: "high-five"; color: UnoColor; value: 5 }
  | { id: string; kind: "seven-change-left"; color: "red" | "yellow"; value: 7 }
  | { id: string; kind: "seven-change-right"; color: "green" | "blue"; value: 7 }
  | { id: string; kind: "wild-up" | "wild-battle" | "wild-target-four" | "wild-multiply-two" | "wild-divide-two" | "wild-shield" | "wild-discard" | "wild-random" | "wild-draw-six" | "wild-draw-eight"; color: null };

// Distribute over the union so removing IDs preserves kind/color/value constraints.
type WithoutId<T> = T extends { id: string } ? Omit<T, "id"> : never;
export type UnoExpandedCardFace = WithoutId<UnoExpandedCard>;

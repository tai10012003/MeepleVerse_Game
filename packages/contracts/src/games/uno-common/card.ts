export const UNO_COLORS = ["red", "yellow", "green", "blue"] as const;
export type UnoColor = typeof UNO_COLORS[number];
export type UnoDirection = 1 | -1;

/** The standard card faces shared by UNO editions, without edition-specific rules. */
export type UnoStandardCard =
  | { id: string; kind: "number"; color: UnoColor; value: number }
  | { id: string; kind: "skip" | "reverse" | "draw-two"; color: UnoColor }
  | { id: string; kind: "wild" | "wild-draw-four"; color: null };

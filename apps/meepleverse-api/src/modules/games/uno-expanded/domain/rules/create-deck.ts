import { UNO_EXPANDED_DECK_CONFIG } from "../constants/deck-config.js";
import type { Card } from "../models/card.js";

/** Creates an ordered, unshuffled deck. IDs identify cards within one deck/match. */
export function createExpandedDeck(): Card[] {
  return UNO_EXPANDED_DECK_CONFIG.flatMap(({ face, copies }) => {
    const label = ["uno-expanded", face.color ?? "black", face.kind, ...("value" in face ? [face.value] : [])].join(":");
    return Array.from({ length: copies }, (_, copy) => ({ ...face, id: label + ":" + copy }));
  });
}

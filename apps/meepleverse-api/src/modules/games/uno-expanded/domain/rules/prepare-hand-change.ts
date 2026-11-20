import type { UnoExpandedCard, UnoExpandedCommand, UnoColor } from "@meepleverse/contracts/uno-expanded";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import { requireExpanded } from "../errors/uno-expanded.errors.js";
export interface HandChangePlan {
  kind: "single" | "divide" | "color";
  cards: UnoExpandedCard[];
  color?: UnoColor;
  requiresUno: boolean;
}
/** Validate the whole choice before any card moves; client ordering cannot arrange the stock. */
export function prepareHandChange(actor: UnoExpandedGame["players"][number], card: UnoExpandedCard,
  command: Extract<UnoExpandedCommand, { type: "PLAY_CARD" }>): HandChangePlan {
  const remaining = actor.hand.filter(held => held.id !== card.id);
  let plan: Omit<HandChangePlan, "requiresUno"> = { kind: "single", cards: [] };
  if (card.kind === "wild-divide-two") {
    const ids = command.discardCardIds ?? [];
    const selected = new Set(ids);
    requireExpanded(ids.length === Math.floor(remaining.length / 2) && selected.size === ids.length &&
      ids.every(id => remaining.some(held => held.id === id)), "INVALID_SELECTION");
    plan = { kind: "divide", cards: remaining.filter(held => selected.has(held.id)) };
  } else {
    requireExpanded(command.discardCardIds === undefined, "INVALID_SELECTION");
    if (card.kind === "discard-color" || card.kind === "wild-discard") {
      const color = card.color ?? command.chosenColor!;
      plan = { kind: "color", color, cards: remaining.filter(held => held.color === color) };
    }
  }
  const requiresUno = actor.hand.length >= 2 && remaining.length - plan.cards.length === 1;
  requireExpanded(!command.declareUno || requiresUno, "INVALID_UNO_CALL");
  return { ...plan, requiresUno };
}

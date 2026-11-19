import type { UnoCard, UnoView } from "@meepleverse/contracts/uno";
import { colorNames } from "../../uno-common/model/color-names";
export { colorNames };
export function cardSymbol(card: UnoCard): string {
  return card.kind === "number" ? String(card.value) : ({ skip: "⊘", reverse: "⇄", "draw-two": "+2", wild: "✦", "wild-draw-four": "+4" })[card.kind];
}
export function cardName(card: UnoCard): string {
  const label = card.kind === "number" ? String(card.value) : ({ skip: "Bỏ lượt", reverse: "Đảo chiều", "draw-two": "Rút hai", wild: "Đổi màu", "wild-draw-four": "Đổi màu rút bốn" })[card.kind];
  return card.color ? colorNames[card.color] + " " + label : label;
}
// Visual hints only; the authoritative server validates all commands.
export function isPlayable(card: UnoCard, game: UnoView): boolean {
  if (game.phase === "draw-stack") return card.kind === "draw-two" || card.kind === "wild-draw-four";
  if (game.phase !== "turn" && game.phase !== "drawn") return false;
  if (game.phase === "drawn" && game.self.drawnCardId !== card.id) return false;
  if (card.color === null || card.color === game.activeColor) return true;
  return card.kind === "number" && game.topCard.kind === "number"
    ? card.value === game.topCard.value
    : card.kind !== "number" && card.kind === game.topCard.kind;
}

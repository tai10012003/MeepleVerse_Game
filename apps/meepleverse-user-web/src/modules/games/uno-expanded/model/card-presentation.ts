import type { UnoExpandedCardFace } from "@meepleverse/contracts/uno-expanded";
import { colorNames } from "../../uno-common/model/color-names";
export const CARD_INKS = { red: "#ed1c24", yellow: "#f4c20d", green: "#35aa36", blue: "#007ac1" } as const;
export const expandedCardLabels = {
  "wild-card-swap": "Đổi tay bài",
  number: "Lá số", skip: "Cấm lượt", reverse: "Đổi chiều", "draw-two": "+2", wild: "Đổi màu", "wild-draw-four": "+4",
  "wild-up": "Tăng tiến", "wild-battle": "Hai kiếm · Battle", tornado: "Lốc xoáy", "high-five": "Đập tay · số 5",
  "seven-change-left": "Chuyền trái · 7 L", "seven-change-right": "Chuyền phải · 7 R", "wild-target-four": "+4 chỉ định",
  "wild-multiply-two": "Nhân hai", "wild-divide-two": "Chia hai", "wild-shield": "Khiên", "skip-two": "Cấm hai người",
  "discard-color": "Xả màu cố định", "wild-discard": "Xả màu tự chọn", "wild-random": "Rút ngẫu nhiên", "wild-draw-six": "+6", "wild-draw-eight": "+8",
} satisfies Record<UnoExpandedCardFace["kind"], string>;
export function expandedCardName(card: UnoExpandedCardFace): string {
  const label = card.kind === "number" ? String(card.value) : expandedCardLabels[card.kind];
  return card.color ? `${colorNames[card.color]} · ${label}` : label;
}
export function unreachableCard(card: never): never { throw new Error(`Unknown expanded card: ${JSON.stringify(card)}`); }

import type { UnoExpandedCard } from "@meepleverse/contracts/uno-expanded";
import { ExpandedCardFace, expandedCardName } from "../cards";
export function CardChoiceGrid({ cards, selectedIds, limit, disabled, onToggle, replace = false }: { cards: UnoExpandedCard[]; selectedIds: string[]; limit: number; disabled: boolean; onToggle: (id: string) => void; replace?: boolean }) {
  return <div className="expanded-choice-hand">{cards.map(card => {
    const selected = selectedIds.includes(card.id);
    return <button type="button" key={card.id} aria-label={expandedCardName(card)} aria-pressed={selected} data-choice-card-id={card.id}
      disabled={disabled || !replace && !selected && selectedIds.length >= limit} onClick={() => onToggle(card.id)}><ExpandedCardFace card={card} decorative /></button>;
  })}</div>;
}

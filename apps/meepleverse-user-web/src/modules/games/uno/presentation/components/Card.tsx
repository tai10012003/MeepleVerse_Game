import type { CSSProperties } from "react";
import type { UnoCard } from "@meepleverse/contracts/uno";
import { cardName, cardSymbol } from "../../model/uno-view-state";
import { ActionArtwork, WildMark, ReverseMark, SkipMark, NumberArtwork } from "./CardArtwork";
import "./card-artwork.css";
export function CardFace({ card }: { card: UnoCard }) {
  const special = card.kind === "wild" || card.kind === "draw-two" || card.kind === "wild-draw-four";
  const corner = card.kind === "wild" ? <WildMark /> : card.kind === "reverse" ? <ReverseMark /> : card.kind === "skip" ? <SkipMark /> : cardSymbol(card);
  return <span className={"uno-card-face color-" + (card.color ?? "wild") + (special ? " card-special kind-" + card.kind : "")} aria-hidden="true">
    <span className={"card-corner" + (card.kind === "wild" ? " wild-corner" : "")}>{corner}</span>
    <span className="card-oval" />
    {card.kind === "number" ? <NumberArtwork value={card.value} /> : <ActionArtwork kind={card.kind} />}
    <span className={"card-corner bottom" + (card.kind === "wild" ? " wild-corner" : "")}>{corner}</span>
  </span>;
}
export function Card({ card, selected, disabled, isNew = false, suggested = false, blocked = false, index, count, onSelect }: {
  card: UnoCard; suggested?: boolean; blocked?: boolean; isNew?: boolean; selected: boolean; disabled: boolean; index: number; count: number; onSelect: () => void;
}) {
  return <button type="button" className={"uno-hand-card" + (selected ? " is-selected" : "") + (isNew ? " is-new" : "") + (suggested ? " is-suggested" : "") + (blocked ? " is-blocked" : "")}
    style={{ "--angle": Math.max(-9, Math.min(9, (index - (count - 1) / 2) * 2)) + "deg" } as CSSProperties}
    aria-label={cardName(card)} aria-pressed={selected} disabled={disabled} onClick={onSelect}
    data-card-id={card.id} data-card-kind={card.kind}>
    <CardFace card={card} />
    {isNew && <span className="new-card-label">Vừa bốc</span>}
  </button>;
}

import type { CSSProperties } from "react";
import type { UnoExpandedCardFace } from "@meepleverse/contracts/uno-expanded";
import { CARD_INKS, expandedCardName } from "../../model/card-presentation";
import { CardSwapPreview } from "./CardSwapPreview";
import { ExpandedCardArtwork } from "./ExpandedCardArtwork";
import { ExpandedCardCorner } from "./ExpandedCardCorner";
import "./expanded-cards.css";
const OUTLINED = new Set<UnoExpandedCardFace["kind"]>(["number", "skip", "reverse", "draw-two"]);
const NO_OVAL = new Set<UnoExpandedCardFace["kind"]>(["wild", "wild-draw-four", "wild-draw-six", "wild-draw-eight", "wild-battle", "wild-random", "wild-discard"]);
/** Presentation only: accepts a face, never a private room snapshot or gameplay command. */
export function ExpandedCardFace({ card, decorative = false, className = "" }: {
  card: UnoExpandedCardFace; decorative?: boolean; className?: string;
}) {
  if (card.kind === "wild-card-swap") return <CardSwapPreview decorative={decorative} className={className} />;
  const ink = card.color ? CARD_INKS[card.color] : "#121212";
  const outline = OUTLINED.has(card.kind);
  return <svg className={`expanded-card-face ${className}`} viewBox="0 0 100 144" focusable="false"
    role={decorative ? undefined : "img"} aria-label={decorative ? undefined : expandedCardName(card)} aria-hidden={decorative || undefined}
    data-card-kind={card.kind} data-card-color={card.color ?? "wild"}
    style={{ "--face-ink": ink, color: outline ? "#fff" : ink } as CSSProperties}>
    <rect width="100" height="144" rx="8" fill="#fffdf4" />
    <rect x="3.5" y="3.5" width="93" height="137" rx="5" fill={ink} />
    {!NO_OVAL.has(card.kind) && <ellipse data-card-oval="true" cx="50" cy="72" rx="38" ry="52" transform="rotate(28 50 72)"
      fill={outline ? "none" : "#fffdf8"} stroke="#fff" strokeWidth={outline ? 2.6 : 0} />}
    <g data-artwork="center"><ExpandedCardArtwork card={card} /></g>
    <g transform="translate(8 9)" color="#fff" data-artwork="corner"><ExpandedCardCorner card={card} /></g>
    <g transform="translate(92 135) rotate(180)" color="#fff" aria-hidden="true"><ExpandedCardCorner card={card} /></g>
  </svg>;
}

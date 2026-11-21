import type { UnoExpandedCardFace } from "@meepleverse/contracts/uno-expanded";
import { ExpandedCardFace } from "@/modules/games/uno-expanded/presentation/cards";
const faces: Record<"basic" | "expanded", readonly UnoExpandedCardFace[]> = {
  basic: [
    { kind: "number", color: "red", value: 7 },
    { kind: "skip", color: "green" },
    { kind: "wild-draw-four", color: null },
    { kind: "number", color: "yellow", value: 2 },
    { kind: "draw-two", color: "blue" },
  ],
  expanded: [
    { kind: "number", color: "green", value: 7 },
    { kind: "wild-up", color: null },
    { kind: "wild-draw-eight", color: null },
    { kind: "wild-shield", color: null },
    { kind: "wild-multiply-two", color: null },
  ],
};
/** Reuses the gameplay SVG faces and shared number/action vectors; no separate cover artwork. */
export function GameArtwork({ variant }: { variant: "basic" | "expanded" }) {
  return <div className={"game-artwork artwork-" + variant} aria-hidden="true">
    <div className="artwork-orbit" /><div className="artwork-orbit orbit-offset" />
    <span className="artwork-star star-a">✦</span><span className="artwork-star star-b">✧</span>
    <span className="artwork-token token-a" /><span className="artwork-token token-b" />
    <div className="card-showcase">{faces[variant].map((card,index) => <div className="catalog-card" key={index}><ExpandedCardFace card={card} decorative /></div>)}</div>
    <span className="artwork-wordmark">{variant === "basic" ? "QUEN LUẬT · VÀO BÀN THÔI" : "LÁ MỚI · THÊM BẤT NGỜ"}</span>
  </div>;
}

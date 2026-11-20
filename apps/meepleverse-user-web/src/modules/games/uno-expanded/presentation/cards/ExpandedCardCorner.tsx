import type { UnoExpandedCardFace } from "@meepleverse/contracts/uno-expanded";
import { ReverseMark, SkipMark, WildMark } from "../../../uno-common/presentation/components/CardArtwork";
import { unreachableCard } from "../../model/card-presentation";
import { SwordsSymbol, ShieldSymbol, UpSymbol, HandSymbol, TargetSymbol, TornadoSymbol } from "./CardSymbols";
function Icon({ children, y = 0, size = 18 }: { children: React.ReactNode; y?: number; size?: number }) { return <svg x="0" y={y} width={size} height={size} viewBox="0 0 100 100">{children}</svg>; }
function Label({ children }: { children: React.ReactNode }) { return <text x="0" y="15" className="expanded-corner-text">{children}</text>; }
export function ExpandedCardCorner({ card }: { card: UnoExpandedCardFace }) {
  switch (card.kind) {
    case "number": return <Label>{card.value}</Label>;
    case "skip": return <svg width="17" height="17"><SkipMark /></svg>;
    case "reverse": return <svg width="17" height="21"><ReverseMark /></svg>;
    case "draw-two": return <Label>+2</Label>;
    case "wild-draw-four": return <Label>+4</Label>;
    case "wild": return <svg x="-3" y="-3" width="21" height="27"><WildMark /></svg>;
    case "wild-battle": return <Icon><SwordsSymbol /></Icon>;
    case "wild-up": return <Icon><UpSymbol corner /></Icon>;
    case "wild-shield": return <Icon><ShieldSymbol /></Icon>;
    case "tornado": return <Icon><TornadoSymbol /></Icon>;
    case "high-five": return <><Label>5</Label><Icon y={18} size={12}><HandSymbol /></Icon></>;
    case "seven-change-left": case "seven-change-right": return <><Label>7</Label><circle cx="7" cy="25" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" /><text x="7" y="28" textAnchor="middle" fill="currentColor" fontSize="9" fontWeight="900">{card.kind === "seven-change-left" ? "L" : "R"}</text></>;
    case "wild-target-four": return <><Label>+4</Label><Icon y={20} size={14}><TargetSymbol /></Icon></>;
    case "wild-multiply-two": return <Label>×2</Label>;
    case "wild-divide-two": return <Label>÷2</Label>;
    case "skip-two": return <><Icon size={17}><circle cx="50" cy="50" r="33" fill="none" stroke="currentColor" strokeWidth="8" /><path d="M26 26L74 74" stroke="currentColor" strokeWidth="8" /></Icon><text x="0" y="30" className="expanded-corner-text" fontSize="12">×2</text></>;
    case "discard-color": return <Label>×</Label>;
    case "wild-discard": return <Icon><path d="M18 18L82 82M82 18L18 82" stroke="#fff" strokeWidth="18" /><path d="M18 18L50 50" stroke="#f4c20d" strokeWidth="11" /><path d="M82 18L50 50" stroke="#35aa36" strokeWidth="11" /><path d="M18 82L50 50" stroke="#007ac1" strokeWidth="11" /><path d="M82 82L50 50" stroke="#ed1c24" strokeWidth="11" /></Icon>;
    case "wild-random": return <Label>+?</Label>;
    case "wild-draw-six": return <Label>+6</Label>;
    case "wild-draw-eight": return <Label>+8</Label>;
    default: return unreachableCard(card);
  }
}

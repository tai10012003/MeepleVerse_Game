import type { UnoExpandedCardFace } from "@meepleverse/contracts/uno-expanded";
import { ActionArtwork, NumberArtwork } from "../../../uno-common/presentation/components/CardArtwork";
import { unreachableCard } from "../../model/card-presentation";
import { FourColorOval, ShieldSymbol, UpSymbol, TargetSymbol, TornadoSymbol, SevenSymbol, CardCluster, DiscardSymbol, SkipSymbol } from "./CardSymbols";
function Center({ children }: { children: React.ReactNode }) { return <svg x="17" y="39" width="66" height="66" viewBox="0 0 100 100">{children}</svg>; }
export function ExpandedCardArtwork({ card }: { card: UnoExpandedCardFace }) {
  switch (card.kind) {
    case "number": return <svg x="0" y="2" width="100" height="140"><NumberArtwork value={card.value} /></svg>;
    case "skip": case "reverse": case "draw-two": case "wild": case "wild-draw-four":
      return <svg x="0" y="2" width="100" height="140"><ActionArtwork kind={card.kind} /></svg>;
    case "wild-battle": case "wild-random": return <FourColorOval />;
    case "wild-up": return <Center><UpSymbol /></Center>;
    case "wild-shield": return <Center><ShieldSymbol /></Center>;
    case "wild-target-four": return <Center><TargetSymbol /></Center>;
    case "tornado": return <Center><TornadoSymbol /></Center>;
    case "seven-change-left": case "seven-change-right": return <Center><SevenSymbol direction={card.kind === "seven-change-left" ? "L" : "R"} /></Center>;
    case "high-five": return <text x="48" y="72" dominantBaseline="central" textAnchor="middle" className="expanded-face-number">5</text>;
    case "wild-multiply-two": return <Center><CardCluster doubled /></Center>;
    case "wild-divide-two": return <Center><CardCluster divide /></Center>;
    case "discard-color": return <Center><DiscardSymbol /></Center>;
    case "wild-discard": return <><FourColorOval /><Center><DiscardSymbol wild /></Center></>;
    case "skip-two": return <Center><SkipSymbol /></Center>;
    case "wild-draw-six": case "wild-draw-eight": return <Center><CardCluster /></Center>;
    default: return unreachableCard(card);
  }
}

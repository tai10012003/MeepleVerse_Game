import type { UnoExpandedCardFace } from "@meepleverse/contracts/uno-expanded";
import { ActionArtwork, NumberArtwork } from "../../../uno-common/presentation/components/CardArtwork";
import { unreachableCard } from "../../model/card-presentation";
import { FourColorOval, ShieldSymbol, UpSymbol, TargetSymbol, TornadoSymbol, SevenSymbol, CardCluster, DiscardSymbol, SkipSymbol } from "./CardSymbols";
function Center({ children, size = 60 }: { children: React.ReactNode; size?: number }) { return <svg x={50 - size / 2} y={72 - size / 2} width={size} height={size} viewBox="0 0 100 100">{children}</svg>; }
export function ExpandedCardArtwork({ card }: { card: UnoExpandedCardFace }) {
  switch (card.kind) {
    case "number": return <svg x="6" y="10" width="88" height="124" viewBox="0 0 100 140"><NumberArtwork value={card.value} /></svg>;
    case "skip": case "reverse": case "draw-two": case "wild": case "wild-draw-four": case "wild-draw-six": case "wild-draw-eight":
      return <svg x="6" y="10" width="88" height="124" viewBox="0 0 100 140"><ActionArtwork kind={card.kind === "wild-draw-six" || card.kind === "wild-draw-eight" ? "wild-draw-four" : card.kind} /></svg>;
    case "wild-battle": case "wild-random": return <FourColorOval />;
    case "wild-up": return <svg x="17" y="29" width="66" height="86" viewBox="0 0 100 100" preserveAspectRatio="none"><UpSymbol /></svg>;
    case "wild-shield": return <Center><ShieldSymbol /></Center>;
    case "wild-target-four": return <Center><TargetSymbol /></Center>;
    case "tornado": return <Center><TornadoSymbol /></Center>;
    case "seven-change-left": case "seven-change-right": return <SevenSymbol direction={card.kind === "seven-change-left" ? "L" : "R"} />;
    case "high-five": return <svg x="6" y="10" width="88" height="124" viewBox="0 0 100 140"><NumberArtwork value={5} fill="currentColor" strokeWidth={1.2} /></svg>;
    case "wild-multiply-two": return <Center size={76}><CardCluster doubled /></Center>;
    case "wild-divide-two": return <Center size={72}><CardCluster divide /></Center>;
    case "discard-color": return <Center><DiscardSymbol /></Center>;
    case "wild-discard": return <><FourColorOval /><Center><DiscardSymbol wild /></Center></>;
    case "skip-two": return <Center><SkipSymbol /></Center>;
    default: return unreachableCard(card);
  }
}

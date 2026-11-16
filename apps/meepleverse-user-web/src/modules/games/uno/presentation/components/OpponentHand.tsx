import type { CSSProperties } from "react";
import { CardBack } from "./CardBack";
export function OpponentHand({ count }: { count: number }) {
  return <div className="opponent-hand" role="img" aria-label={count + " lá bài úp"} data-count={count} style={{ "--back-count": Math.max(1, count) } as CSSProperties}>
    {Array.from({ length: count }, (_, index) => <i className="opponent-card-back" key={index} aria-hidden="true" style={{ "--back-index": index, "--back-angle": (count > 1 ? (index / (count - 1) - .5) * 18 : 0) + "deg", "--back-rise": Math.abs(count > 1 ? index / (count - 1) - .5 : 0) * 7 + "px" } as CSSProperties}><CardBack /></i>)}
  </div>;
}

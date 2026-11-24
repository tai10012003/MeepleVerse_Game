"use client";
import { motion } from "motion/react";
import { CardBack } from "@/modules/games/uno-common";
import { playerPoint, type EffectGeometry } from "../../../uno/presentation/animations/effect-geometry";
import { SWAP_DELAY, SWAP_DURATION, type ExpandedEffectPlan } from "../../model/expanded-effects";

/** Public counts and seat anchors only: transferred card faces never enter a flight. */
export function SwapSequence({ swap, geometry, speed }: { swap: NonNullable<ExpandedEffectPlan["swap"]>; geometry: EffectGeometry; speed: number }) {
  const transfers = [
    { from: swap.playerId, to: swap.targetPlayerId, count: swap.targetHandCount },
    { from: swap.targetPlayerId, to: swap.playerId, count: swap.playerHandCount },
  ];
  const width = geometry.width * .8, height = geometry.height * .8;
  const point = (id: string) => {
    const seat = playerPoint(geometry, id);
    return { x: Math.max(width, Math.min(innerWidth - width, seat.x)), y: Math.max(90, Math.min(innerHeight - height, seat.y)) };
  };
  return <>{transfers.map((transfer, index) => {
    const from = point(transfer.from), to = point(transfer.to);
    const middle = { x: (from.x + to.x) / 2 + (index ? 28 : -28), y: Math.max(95, Math.min(innerHeight - height, (from.y + to.y) / 2 + (index ? 48 : -48))) };
    const visible = Math.min(transfer.count, 5);
    return <motion.div key={transfer.from} className="flying-card swap-packet" data-effect="swap" data-from-player-id={transfer.from} data-to-player-id={transfer.to} data-card-visibility="back" data-count={transfer.count}
      style={{width,height}} initial={{x:from.x-width/2,y:from.y-height/2,opacity:0}}
      animate={{x:[from.x-width/2,middle.x-width/2,middle.x-width/2,to.x-width/2],y:[from.y-height/2,middle.y-height/2,middle.y-height/2,to.y-height/2],opacity:[0,1,1,0],scale:[.85,1.05,1.05,.85]}}
      transition={{delay:SWAP_DELAY*speed,duration:SWAP_DURATION*speed,times:[0,.4,.6,1],ease:"easeInOut"}}>
      {Array.from({length:visible},(_,i)=><div key={i} className="swap-packet-card" style={{transform:`translate(${(i-(visible-1)/2)*6}px,${Math.abs(i-(visible-1)/2)*2}px) rotate(${(i-(visible-1)/2)*7}deg)`}}><CardBack /></div>)}
      <span className="swap-packet-count">{transfer.count}</span>
    </motion.div>;
  })}</>;
}

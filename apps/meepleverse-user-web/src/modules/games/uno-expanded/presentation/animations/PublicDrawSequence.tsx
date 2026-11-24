"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { CardBack } from "@/modules/games/uno-common";
import { ExpandedCardFace } from "../cards";
import { expandedCardName } from "../../model/card-presentation";
import { publicDrawEnd, type ExpandedEffectPlan } from "../../model/expanded-effects";
import { playerPoint, type EffectGeometry } from "../../../uno/presentation/animations/effect-geometry";

/** Mount only the current public card; private extra draws never enter this component. */
export function PublicDrawSequence({ draw, geometry:geo, speed, reduced }: { draw:ExpandedEffectPlan["draws"][number]; geometry:EffectGeometry; speed:number; reduced:boolean }) {
  const [index,setIndex]=useState(-1);
  const pace=reduced?1:speed;
  useEffect(()=>{
    const timers=draw.publicCards.map((_,i)=>setTimeout(()=>setIndex(i),(draw.delay+i*draw.revealStep)*pace*1000));
    timers.push(setTimeout(()=>setIndex(-1),publicDrawEnd(draw)*pace*1000));
    return ()=>timers.forEach(clearTimeout);
  },[draw,pace]);
  const card=draw.publicCards[index]; if(!card) return null;
  const width=geo.width*1.35,height=geo.height*1.35;
  const center={x:innerWidth/2,y:Math.max(height/2+90,Math.min(innerHeight*.47,geo.discard.y+12))};
  const seat=playerPoint(geo,draw.playerId);
  const to={x:Math.max(width/2,Math.min(innerWidth-width/2,seat.x)),y:Math.max(85,Math.min(innerHeight-height/2,seat.y))};
  const last=index===draw.publicCards.length-1;
  const detail=draw.publicKind==="random" ? card.kind==="number" ? draw.count-1<card.value ? `Cần thêm ${card.value} · chỉ còn ${draw.count-1} lá` : `Bốc thêm ${card.value} lá úp` : "Không bốc thêm" :
    last ? card.color===draw.publicColor ? `Đúng màu · Dừng bốc · Nhận ${draw.count} lá` : `Hết bài bốc · Nhận ${draw.count} lá` : "Chưa đúng màu · Bốc tiếp";
  return <>
    <motion.div key={card.id} className="flying-card public-draw-flight" data-effect="public-reveal" data-player-id={draw.playerId} data-card-id={card.id} data-public-index={index} data-public-kind={draw.publicKind} data-card-visibility="public"
      style={{width,height,perspective:800}} initial={reduced?{x:center.x-width/2,y:center.y-height/2}:{x:geo.deck.x-width/2,y:geo.deck.y-height/2,opacity:0}}
      animate={reduced?{x:center.x-width/2,y:center.y-height/2}:{x:[geo.deck.x-width/2,center.x-width/2,center.x-width/2,to.x-width/2],y:[geo.deck.y-height/2,center.y-height/2,center.y-height/2,to.y-height/2],opacity:[0,1,1,0],scale:[.85,1,1,.6]}}
      transition={{duration:reduced?0:draw.revealStep*pace,times:[0,.12,.88,1],ease:"easeInOut"}}>
      {reduced?<ExpandedCardFace card={card}/>:<motion.div className="public-draw-flipper" initial={{rotateY:0}} animate={{rotateY:[0,180,180,360]}} transition={{duration:draw.revealStep*pace,times:[0,.12,.88,1]}}>
        <div className="public-draw-back"><CardBack/></div><div className="public-draw-front"><ExpandedCardFace card={card}/></div>
      </motion.div>}
    </motion.div>
    <div className="draw-reveal-caption public-draw-caption" data-effect="public-caption" data-player-id={draw.playerId} style={{left:center.x,top:center.y+height/2+16}}>
      <strong>Lá {index+1} · {expandedCardName(card)}</strong><span>{detail}</span>
    </div>
  </>;
}

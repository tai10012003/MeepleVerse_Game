"use client";
import { scheduleExpandedAudio } from "./expanded-audio";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import { DRAW_DURATION, DRAW_STAGGER, NOTICE_DURATION, planExpandedEffects, type ExpandedVisualFrame, type ExpandedEffectPlan, type ExpandedPresentation } from "../../model/expanded-effects";
import { cacheGeometry, effectGeometry, playerPoint, type EffectGeometry, type GeometryCache } from "../../../uno/presentation/animations/effect-geometry";
import { discardPlacement } from "../../../uno-common/model/discard-layout";
import { expandedCardName } from "../../model/card-presentation";
import { ReverseMark, SkipMark } from "../../../uno/presentation/components/CardArtwork";
import { ExpandedCardFace } from "../cards";
import { CardBack } from "@/modules/games/uno-common";
import "../../../uno/presentation/animations/uno-effects.css";

const anchors = { card: ".expanded-hand-card", opponent: ".expanded-opponent[data-player-id]", hand: ".expanded-hand-scroll", deck: ".expanded-draw button", discard: ".expanded-discard", table: ".expanded-table", identity: ".expanded-identity", handArea: ".expanded-hand" };
interface Scene { frame: ExpandedVisualFrame; plan: ExpandedEffectPlan; geometry: EffectGeometry; speed: number; reduced: boolean }
function SceneView({ scene }: { scene: Scene }) {
  const { frame, plan, geometry: geo, reduced, speed } = scene;
  const duration = (value: number) => reduced ? .12 : value * speed;
  const delay = (value: number) => reduced ? 0 : value * speed;
  const playStart = plan.played ? (plan.played.playerId === frame.after.selfPlayerId ? geo.cardOrigins.get(plan.played.card.id) : undefined) ?? playerPoint(geo, plan.played.playerId) : geo.discard;
  const screenPoint = (point: { x: number; y: number }) => ({ x: Math.max(35, Math.min(innerWidth - 35, point.x)), y: Math.max(75, Math.min(innerHeight - 80, point.y)) });
  return <div className="uno-effects" data-testid="expanded-effects" data-frame-id={frame.id} data-reduced-motion={reduced ? "true" : "false"} aria-hidden="true">
    {!reduced && plan.played && <>
      <motion.div className="flying-card played-flight" data-effect="play" style={{ width: geo.width, height: geo.height }}
        initial={{ x: playStart.x - geo.width / 2, y: playStart.y - geo.height / 2, rotate: -16, scale: .92 }}
        animate={{ x: [playStart.x - geo.width / 2, (playStart.x + geo.discard.x) / 2 - geo.width / 2, geo.discard.x - geo.width / 2],
          y: [playStart.y - geo.height / 2, Math.min(playStart.y, geo.discard.y) - geo.height / 2 - 65, geo.discard.y - geo.height / 2],
          rotate: [-16, 12, plan.played ? discardPlacement(plan.played.card.id).angle : 0], scale: [.92, 1.18, 1], opacity: 0 }}
        transition={{ duration: duration(.48), ease: "easeOut", times: [0, .58, 1], opacity: { delay: duration(.48), duration: 0 } }}>
        <ExpandedCardFace card={plan.played.card} />
      </motion.div>
      <motion.div className={"impact-ring color-" + (plan.played.card.color ?? frame.after.game?.activeColor ?? "wild")} data-effect="impact" style={{ left: geo.discard.x, top: geo.discard.y }}
        initial={{ opacity: 0, scale: .25 }} animate={{ opacity: [0, .8, 0], scale: [.25, 1.1, 2.2] }}
        transition={{ delay: delay(.41), duration: duration(.35) }} />
    </>}
    {plan.draws.map((draw, index) => <DrawSequence key={index} draw={draw} scene={scene} />)}
    {plan.badges.map((badge, index) => {
      const origin = screenPoint((badge.playerId ? geo.notices.get(badge.playerId) : undefined) ?? playerPoint(geo, badge.playerId));
      const half = innerWidth <= 640 ? 72 : 88;
      const point = { x: Math.max(half * 1.2 + 8, Math.min(innerWidth - half * 1.2 - 8, origin.x)), y: origin.y };
      return <motion.div className={"effect-badge tone-" + badge.tone + " color-" + (badge.color ?? "wild")} key={index} data-effect="badge" data-player-id={badge.playerId ?? "table"} data-symbol={badge.symbol} data-effect-color={badge.color ?? "wild"}
        style={{ left: point.x, top: Math.min(innerHeight - 90, point.y - 12 + plan.badges.slice(0, index).filter(other => other.playerId === badge.playerId).length * 42) }}
        initial={{ opacity: 0, scale: reduced ? 1 : .35, y: reduced ? 0 : 12 }}
        animate={{ opacity: [0, 1, 1, 0], scale: reduced ? 1 : [.35, 1.2, 1, .95], y: reduced ? 0 : [12, -5, -5, -18] }}
        transition={{ delay: delay(badge.delay), duration: NOTICE_DURATION, times: [0, .075, .925, 1] }}>
        <strong>{badge.tone === "reverse" ? <ReverseMark /> : badge.tone === "skip" ? <SkipMark /> : badge.symbol}</strong><span>{badge.label}</span>
      </motion.div>;
    })}
    {plan.turnId && <motion.div className={"turn-toast" + (plan.turnId === frame.after.selfPlayerId ? " your-turn" : "")}
      data-effect="turn" data-player-id={plan.turnId} style={{ left: Math.max(95, Math.min(innerWidth - 95, geo.notices.get(plan.turnId)?.x ?? geo.turn.x)), top: Math.min(innerHeight - 90, (geo.notices.get(plan.turnId)?.y ?? geo.turn.y) + (plan.turnId === frame.after.selfPlayerId ? -50 : 55)) }}
      initial={{ opacity: 0, scale: reduced ? 1 : .85, y: reduced ? 0 : 10 }}
      animate={{ opacity: [0, 1, 1, 0], scale: reduced ? 1 : [.85, 1.05, 1, 1], y: reduced ? 0 : [10, 0, 0, -8] }}
      transition={{ delay: reduced && plan.draws.length ? NOTICE_DURATION + .2 : delay(plan.turnDelay), duration: NOTICE_DURATION, times: [0, .075, .925, 1] }}>
      <i />{plan.turnId === frame.after.selfPlayerId && frame.after.game?.phase === "turn" ? "Đến lượt bạn!" : plan.turnLabel}
    </motion.div>}
  </div>;
}

function DrawSequence({ draw, scene }: { draw: ExpandedEffectPlan["draws"][number]; scene: Scene }) {
  const { frame, geometry: geo, speed } = scene;
  const self = draw.playerId === frame.after.selfPlayerId;
  const separate = !self && scene.plan.draws.length > 1;
  const width = geo.width * (separate ? .75 : 1.35);
  const height = geo.height * (separate ? .75 : 1.35);
  const step = Math.min(width * .72, (innerWidth - width - 48) / Math.max(1, Math.min(draw.count, 8) - 1));
  const seat = playerPoint(geo, draw.playerId);
  const reveal = separate ? { x: Math.max(width, Math.min(innerWidth - width, seat.x)), y: Math.max(height / 2 + 80, Math.min(innerHeight - height, seat.y)) }
    : { x: innerWidth / 2, y: Math.max(height / 2 + 80, Math.min(innerHeight * .48, geo.discard.y + 20)) };
  const miniResult = frame.events.some(event => event.type === "UP_ENDED" || event.type === "BATTLE_RESOLVED" || event.type === "HIGH_FIVE_RESOLVED");
  const drawLabel = self && !miniResult ? draw.count === 1 && draw.cards[0] ? "Vừa bốc · " + expandedCardName(draw.cards[0]) : "Bạn vừa bốc " + draw.count + " lá" : "";
  const caption = [draw.context, drawLabel].filter(Boolean).join(" · ");
  return <>
    {!scene.reduced && Array.from({ length: Math.min(draw.count, 8) }, (_, index) => {
      const card = draw.cards[index];
      const offset = index - (Math.min(draw.count, 8) - 1) / 2;
      const target = card ? geo.cardOrigins.get(card.id) ?? seat : seat;
      const destination = { x: Math.max(width / 2, Math.min(innerWidth - width / 2, target.x)), y: Math.max(80, Math.min(innerHeight - 80, target.y)) };
      const fanX = reveal.x + offset * step;
      const fanY = reveal.y + Math.abs(offset) * 4;
      return <motion.div key={index} className={"flying-card drawn-flight" + (card ? " revealed-draw" : " card-back-flight")}
        data-effect="draw" data-player-id={draw.playerId} data-card-visibility={card ? "self" : "back"}
        data-draw-duration={DRAW_DURATION} data-draw-stagger={DRAW_STAGGER}
        style={{ width, height, zIndex: index }}
        initial={{ x: geo.deck.x - width / 2, y: geo.deck.y - height / 2, rotate: -7, opacity: 0, scale: .9 }}
        animate={{ x: [geo.deck.x - width / 2, fanX - width / 2, fanX - width / 2, destination.x - width / 2],
          y: [geo.deck.y - height / 2, fanY - height / 2, fanY - height / 2, destination.y - height / 2],
          rotate: [-7, offset * 5, offset * 5, 0], opacity: [0, 1, 1, 0], scale: [.9, 1, 1, .6] }}
        transition={{ delay: (draw.delay + index * DRAW_STAGGER) * speed, duration: DRAW_DURATION * speed, times: [0, .28, .78, 1], ease: "easeInOut" }}>
        {card ? <ExpandedCardFace card={card} /> : <CardBack />}
      </motion.div>;
    })}
    {caption && <motion.div className="draw-reveal-caption" data-player-id={draw.playerId}
      style={{ left: reveal.x, top: reveal.y + height / 2 + Math.max(0, (Math.min(draw.count, 8) - 1) / 2) * 4 + 15, zIndex: draw.count }}
      initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ delay: scene.reduced ? 0 : (draw.delay + .35) * speed, duration: scene.reduced ? NOTICE_DURATION : (1.5 + (Math.min(draw.count, 8) - 1) * DRAW_STAGGER) * speed, times: [0, .12, .82, 1] }}>
      {caption}
    </motion.div>}
  </>;
}

export function ExpandedEffects({ frames, view, onComplete, onPresent }: { frames: ExpandedVisualFrame[]; view: UnoExpandedRoomView; onComplete: (id: string) => void; onPresent: (value: ExpandedPresentation | null) => void }) {
  const reduced = useReducedMotion() === true;
  const [scene, setScene] = useState<Scene | null>(null);
  const seen = useRef(new Set<string>());
  const queue = useRef<ExpandedVisualFrame[]>([]);
  const cache = useRef<GeometryCache>({ cards: new Map(), players: new Map() });
  const running = useRef(false);
  const life = useRef(0);
  const cancelScene = useRef<(() => void) | null>(null);
  const motionPreference = useRef(reduced);
  useLayoutEffect(() => { motionPreference.current = reduced; if (reduced) cancelScene.current?.(); }, [reduced]);
  useLayoutEffect(() => { cacheGeometry(cache.current, view.selfPlayerId, anchors); }, [view]);

  async function drain() {
    if (running.current) return;
    running.current = true;
    const token = life.current;
    // Defer to the next microtask so React has committed anchors before measurement.
    await Promise.resolve();
    try {
      while (queue.current.length && token === life.current) {
        const frame = queue.current.shift()!;
        if (document.hidden) { if (!frame.id.startsWith("intro:")) onComplete(frame.id); continue; }
        const plan = planExpandedEffects(frame);
        const speed = queue.current.length > 3 ? .55 : 1;
        const minimize = motionPreference.current;
        const progress: ExpandedPresentation = { frame, landed: !plan.played || minimize, arrived: {} };
        const publish = () => onPresent({ ...progress, arrived: { ...progress.arrived } });
        publish();
        setScene({ frame, plan, geometry: effectGeometry(cache.current, frame, anchors), speed, reduced: minimize });
        const stopAudio = scheduleExpandedAudio(frame, plan, speed, minimize);
        await new Promise<void>(resolve => {
          const arrivals = plan.draws.flatMap(draw => Array.from({ length: draw.count }, (_, index) => setTimeout(() => {
            progress.arrived[draw.playerId] = index + 1; publish();
          }, minimize ? 0 : Math.ceil((draw.delay + DRAW_DURATION + Math.min(index, 7) * DRAW_STAGGER) * speed * 1000))));
          const clearArrivals = () => arrivals.forEach(clearTimeout);
          const landing = setTimeout(() => { progress.landed = true; publish(); }, minimize ? 0 : Math.ceil(.48 * speed * 1000));
          const noticeEnd = Math.max(0, ...(minimize && plan.draws.length ? [NOTICE_DURATION] : []), ...plan.badges.map(badge => (minimize ? 0 : badge.delay * speed) + NOTICE_DURATION), plan.turnId ? (minimize ? (plan.draws.length ? NOTICE_DURATION + .2 : 0) : plan.turnDelay * speed) + NOTICE_DURATION : 0);
          const sceneDuration = Math.max(minimize ? .125 : plan.duration * speed, noticeEnd);
          const timer = setTimeout(() => { clearTimeout(landing); clearArrivals(); stopAudio(); resolve(); }, Math.ceil(sceneDuration * 1000) + 45);
          cancelScene.current = () => { clearTimeout(timer); clearTimeout(landing); clearArrivals(); stopAudio(); resolve(); };
        });
        if (token !== life.current) return;
        setScene(null);
        onPresent(null);
        if (!frame.id.startsWith("intro:")) onComplete(frame.id);
      }
    } finally { if (token === life.current) { running.current = false; cancelScene.current = null; } }
  }
  useEffect(() => {
    const generation = ++life.current;
    // Reconnection starts at a snapshot; old event frames are cleared by the transport.
    const onResize = () => { cancelScene.current?.(); setScene(null); };
    const onVisibility = () => { if (document.hidden) onResize(); };
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    // The initial notice follows the same asynchronous queue as accepted actions.
    void Promise.resolve().then(() => {
      void drain();
    });
    return () => {
      life.current = generation + 1; queue.current = []; running.current = false;
      cancelScene.current?.(); cancelScene.current = null;
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // This lifecycle belongs to a keyed match/connection, not each incoming snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    for (const frame of frames) {
      if (!seen.current.has(frame.id)) { seen.current.add(frame.id); queue.current.push(frame); }
    }
    // Bound catch-up work if a client was inactive while many actions arrived.
    if (queue.current.length > 16) {
      const skipped = queue.current.splice(0, queue.current.length - 16);
      const last = skipped.at(-1);
      if (last && !last.id.startsWith("intro:")) void Promise.resolve().then(() => onComplete(last.id));
    }
    void Promise.resolve().then(() => drain());
    // New frames are the input stream; running work owns its captured motion preferences.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames, reduced]);
  return scene ? <SceneView key={scene.frame.id} scene={scene} /> : null;
}

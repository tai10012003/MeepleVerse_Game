import { playSound, type Sound } from "@/shared/audio/audio";
import { DRAW_STAGGER, NOTICE_DURATION, type EffectPlan, type UnoVisualFrame } from "../../model/uno-effects";
/** Schedule from the same accepted frame as the animations; cancel with its scene. */
export function scheduleUnoAudio(frame: UnoVisualFrame, plan: EffectPlan, speed: number, reduced: boolean) {
  const timers: ReturnType<typeof setTimeout>[] = [];
  if (frame.id.startsWith("intro:")) return () => {};
  const at = (seconds: number, sound: Sound) => { timers.push(setTimeout(() => playSound(sound), Math.max(0, seconds * 1000))); };
  const time = (seconds: number) => reduced ? 0 : seconds * speed;
  if (plan.played) {
    at(time(.48), "play");
    const action: Record<string, Sound> = { skip: "skip", reverse: "reverse", wild: "wild", "wild-draw-four": "penalty", "draw-two": "penalty" };
    const sound = action[plan.played.card.kind];
    if (sound) at(time(.55), sound);
  }
  for (const draw of plan.draws) {
    // Cap audible draws to keep large stacked penalties comfortable.
    const count = reduced ? 1 : Math.min(draw.count, 8);
    for (let index = 0; index < count; index++) at(time(draw.delay + index * DRAW_STAGGER), "draw");
    if (draw.context) at(time(draw.delay), "penalty");
  }
  if (frame.events.some(event => event.type === "UNO_CALLED")) at(time(.65), "uno");
  if (frame.events.some(event => event.type === "COLOR_CHOSEN") && !plan.played) at(0, "wild");
  if (plan.turnId === frame.after.selfPlayerId) at(reduced && plan.draws.length ? NOTICE_DURATION + .2 : time(plan.turnDelay), "turn");
  const ended = frame.events.find(event => event.type === "GAME_ENDED");
  if (ended) at(time(.75), ended.winnerId === frame.after.selfPlayerId ? "win" : "lose");
  return () => timers.forEach(clearTimeout);
}

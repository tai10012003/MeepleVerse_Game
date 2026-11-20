import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import type { EffectContext, EffectOptions } from "../models/effect-context.js";
import { effectContext } from "../models/effect-context.js";
import type { ExpandedTransition } from "./apply-command.js";
import type { RandomSource } from "../../../uno-common/index.js";
import { timeoutBattle } from "./wild-battle.js";
import { finishHighFive } from "./high-five.js";
export function nextEffectDeadline(game: UnoExpandedGame): number | null {
  const effect = game.effect;
  if (!effect || effect.kind === "up" || effect.deadline === null) return null;
  return effect.kind === "high-five" && effect.stage === "preparing" ? effect.opensAt : effect.deadline;
}
export function pauseEffectClock(input: UnoExpandedGame, context: EffectContext): UnoExpandedGame | null {
  const effect = input.effect;
  if (!effect || effect.kind === "up" || effect.deadline === null) return null;
  const game = structuredClone(input); const timed = game.effect!;
  if (timed.kind === "up") return null;
  timed.remainingMs = timed.kind === "high-five" && timed.opensAt !== null && context.now < timed.opensAt
    ? Math.max(0, timed.deadline! - timed.opensAt) : Math.max(0, timed.deadline! - context.now);
  timed.deadline = null;
  if (timed.kind === "high-five") timed.opensAt = null;
  game.revision++; return game;
}
export function resumeEffectClock(input: UnoExpandedGame, context: EffectContext): UnoExpandedGame | null {
  const effect = input.effect;
  if (!effect || effect.kind === "up" || effect.remainingMs === null) return null;
  const game = structuredClone(input); const timed = game.effect!;
  if (timed.kind === "up") return null;
  if (timed.kind === "high-five") {
    timed.attempt++; timed.stage = "preparing"; timed.opensAt = context.now + context.timing.highFivePrepareMs;
    timed.deadline = timed.opensAt + timed.remainingMs!;
  } else timed.deadline = context.now + timed.remainingMs!;
  timed.remainingMs = null; game.revision++; return game;
}
export function advanceExpandedEffects(input: UnoExpandedGame, options: EffectOptions = {}, random: RandomSource = Math.random): ExpandedTransition | null {
  const context = effectContext(options); const next = nextEffectDeadline(input);
  if (input.phase === "ended" || next === null || context.now < next) return null;
  const game = structuredClone(input); const events: ExpandedTransition["events"] = { public: [] }; const effect = game.effect!;
  if (effect.kind === "battle") timeoutBattle(game, context, random, events);
  else if (effect.kind === "high-five") {
    if (context.now >= effect.deadline!) {
      events.public.push({ type: "EFFECT_TIMEOUT", effectId: effect.id, stage: "high-five" });
      finishHighFive(game, random, events);
    } else {
      effect.stage = "active";
      events.public.push({ type: "EFFECT_OPENED", effectId: effect.id, attempt: effect.attempt });
    }
  }
  game.revision++;
  if (!["ended", "high-five", "battle-select"].includes(game.phase)) {
    events.public.push({ type: "TURN_CHANGED", playerId: game.players[game.currentIndex]!.id, phase: game.phase });
  }
  return { state: game, events };
}

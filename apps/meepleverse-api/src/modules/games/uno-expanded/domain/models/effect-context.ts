import { requireExpanded } from "../errors/uno-expanded.errors.js";
export interface EffectTiming { highFivePrepareMs: number; highFiveWindowMs: number; battleChoiceMs: number }
export const DEFAULT_EFFECT_TIMING: Readonly<EffectTiming> = Object.freeze({ highFivePrepareMs: 1000, highFiveWindowMs: 5000, battleChoiceMs: 30000 });
export interface EffectContext { now: number; timing: EffectTiming }
export type EffectOptions = { now?: number; timing?: Partial<EffectTiming> };
export function effectContext(options: EffectOptions = {}): EffectContext {
  const context = { now: options.now ?? Date.now(), timing: { ...DEFAULT_EFFECT_TIMING, ...options.timing } };
  requireExpanded(Number.isFinite(context.now) && context.now >= 0 &&
    Object.values(context.timing).every(value => Number.isFinite(value) && value >= 0) &&
    context.timing.highFiveWindowMs > 0 && context.timing.battleChoiceMs > 0, "INVALID_SETUP");
  return context;
}

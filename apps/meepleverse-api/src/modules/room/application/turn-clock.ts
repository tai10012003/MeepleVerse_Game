import type { TurnClockView } from "@meepleverse/contracts/room-common";
export interface TurnTiming { turnMs: number; upMs: number }
export const DEFAULT_TURN_TIMING: Readonly<TurnTiming> = Object.freeze({ turnMs: 60000, upMs: 30000 });
/** Application clock: independent of card rules and driven by a trusted server time source. */
export class TurnClock {
  private sequence = 0;
  private value: Omit<TurnClockView, "serverNow"> | null = null;
  readonly timing: TurnTiming;
  constructor(timing: Partial<TurnTiming> = {}) {
    this.timing = { ...DEFAULT_TURN_TIMING, ...timing };
    if (Object.values(this.timing).some(ms => !Number.isFinite(ms) || ms <= 0)) throw new Error("Invalid turn timing");
  }
  get deadline() { return this.value?.deadline ?? null; }
  reset(playerId: string, kind: "turn" | "up", now: number) {
    const durationMs = kind === "up" ? this.timing.upMs : this.timing.turnMs;
    this.value = { id: "turn-" + (++this.sequence), playerId, kind, durationMs, deadline: now + durationMs, remainingMs: durationMs };
  }
  clear() { this.value = null; }
  pause(now: number) {
    if (this.value?.deadline != null) { this.value.remainingMs = Math.max(0, this.value.deadline - now); this.value.deadline = null; }
  }
  resume(now: number) { if (this.value && this.value.deadline === null) this.value.deadline = now + this.value.remainingMs; }
  view(now: number): TurnClockView | null {
    return this.value ? { ...this.value, remainingMs: this.value.deadline === null ? this.value.remainingMs : Math.max(0, this.value.deadline - now), serverNow: now } : null;
  }
}

import type { UnoExpandedEvent } from "@meepleverse/contracts/uno-expanded";
export type MiniFeedbackEvent = Extract<UnoExpandedEvent, { type: "BATTLE_REVEALED" | "BATTLE_RESOLVED" | "HIGH_FIVE_RESOLVED" | "UP_ENDED" }>;
export type MiniDraw = Extract<UnoExpandedEvent, { type: "CARDS_DRAWN" }>;
export interface MiniFeedbackFrame { id: string; matchId: string; revision: number; events: MiniFeedbackEvent[]; draws: MiniDraw[] }
export function isMiniFeedback(event: UnoExpandedEvent): event is MiniFeedbackEvent {
  return event.type === "BATTLE_REVEALED" || event.type === "BATTLE_RESOLVED" || event.type === "HIGH_FIVE_RESOLVED" || event.type === "UP_ENDED";
}

export function miniDrawTotals(frames: MiniFeedbackFrame[], matchId: string | null, effectId: string) {
  const totals = new Map<string, number>();
  for (const frame of frames) if (frame.matchId === matchId && frame.events.some(event => event.effectId === effectId)) {
    for (const draw of frame.draws) totals.set(draw.playerId, (totals.get(draw.playerId) ?? 0) + draw.count);
  }
  return Array.from(totals, ([playerId, count]) => ({ playerId, count }));
}

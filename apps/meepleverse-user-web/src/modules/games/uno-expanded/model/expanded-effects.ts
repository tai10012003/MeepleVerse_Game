import type { UnoExpandedCard, UnoExpandedEvent, UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import type { UnoColor } from "@meepleverse/contracts/uno";
import { expandedCardName } from "./card-presentation";
import { DRAW_DURATION, DRAW_STAGGER, NOTICE_DURATION } from "../../uno/model/uno-effects";
export { DRAW_DURATION, DRAW_STAGGER, NOTICE_DURATION };
export interface ExpandedVisualFrame { id: string; matchId: string; revision: number; before: UnoExpandedRoomView; after: UnoExpandedRoomView; events: UnoExpandedEvent[] }
export const SWAP_DELAY = .58;
export const SWAP_DURATION = 1.05;
export interface ExpandedPresentation { frame: ExpandedVisualFrame; landed: boolean; swapStage: "waiting" | "flying" | "arrived"; arrived: Record<string, number> }
export interface ExpandedEffectPlan {
 played: Extract<UnoExpandedEvent, { type: "CARD_PLAYED" }> | undefined;
 swap: Extract<UnoExpandedEvent, { type: "HANDS_SWAPPED" }> | undefined;
 draws: { playerId: string; count: number; cards: UnoExpandedCard[]; delay: number; context?: string; publicCards: UnoExpandedCard[]; publicKind?: "random" | "tornado"; publicColor?: UnoColor; revealStep: number }[];
 badges: { playerId: string | null; symbol: string; label: string; color?: UnoColor | null; tone: "skip" | "reverse" | "wild" | "uno" | "play" | "draw"; delay: number }[];
 turnId: string | null; turnLabel: string; turnDelay: number; duration: number;
}
export function planExpandedEffects(frame: ExpandedVisualFrame): ExpandedEffectPlan {
 const before = frame.before.game, after = frame.after.game;
 const name = (id: string) => frame.after.members.find(member => member.playerId === id)?.nickname ?? "Người chơi";
 const played = frame.events.find((event): event is NonNullable<ExpandedEffectPlan["played"]> => event.type === "CARD_PLAYED");
 const swap = frame.events.find((event): event is NonNullable<ExpandedEffectPlan["swap"]> => event.type === "HANDS_SWAPPED");
 const base = played ? .46 : .04;
 const badges: ExpandedEffectPlan["badges"] = [];
 if (played) {
  const kind = played.card.kind;
  const symbols: Partial<Record<UnoExpandedCard["kind"],string>> = { "draw-two":"+2", "wild-draw-four":"+4", "wild-target-four":"+4", "wild-draw-six":"+6", "wild-draw-eight":"+8" };
  const symbol = symbols[kind] ?? (kind === "number" ? String(played.card.value) : kind === "reverse" ? "↔" : kind === "skip" || kind === "skip-two" ? "⊘" : kind.includes("draw") ? "+" : kind === "wild-shield" ? "🛡" : kind === "wild-multiply-two" ? "×2" : kind === "wild-divide-two" ? "÷2" : kind === "wild-card-swap" ? "⇄" : "✦");
  const tone = kind === "reverse" ? "reverse" : kind === "skip" || kind === "skip-two" ? "skip" : kind.includes("draw") ? "draw" : kind === "number" ? "play" : "wild";
  // Mini-game panels already explain their activation; keep their response area clear.
  if (!after?.effect) badges.push({ playerId: played.playerId, symbol, tone, color: played.card.color ?? after?.activeColor, delay: base,
   label: swap ? name(swap.playerId) + " đổi bài với " + name(swap.targetPlayerId) : name(played.playerId) + " đánh " + expandedCardName(played.card) + (frame.events.some(event => event.type === "UNO_CALLED" && event.playerId === played.playerId) ? " · UNO!" : "") });
 }
 const totals = new Map<string, number>();
 for (const event of frame.events) if (event.type === "CARDS_DRAWN") totals.set(event.playerId, (totals.get(event.playerId) ?? 0) + event.count);
 const reveal = frame.events.find(event => event.type === "RANDOM_REVEALED");
 const tornado = frame.events.find(event => event.type === "TORNADO_REVEALED");
 const oldIds = new Set(before?.self.hand.map(card => card.id));
 const draws: ExpandedEffectPlan["draws"] = [...totals].filter(([,count]) => count > 0).map(([playerId,count]) => {
  const publicCards = tornado?.playerId === playerId ? tornado.cards : reveal?.playerId === playerId ? [reveal.card] : [];
  return { playerId, count, publicCards, revealStep: Math.min(2.5,20 / Math.max(1,publicCards.length)),
    publicKind: tornado?.playerId === playerId ? "tornado" : reveal?.playerId === playerId ? "random" : undefined,
    publicColor: tornado?.playerId === playerId ? tornado.color : undefined,
    cards: playerId === after?.self.playerId ? after.self.hand.filter(card => !oldIds.has(card.id)).slice(0,count) : [], delay: base + .12,
    context: frame.events.some(event => event.type === "UNO_PENALTY" && event.playerId === playerId) ? "Quên hô UNO" : undefined };
 });
 // Finish a separate UNO penalty before the public sequence uses the center.
 const otherEnd = Math.max(0,...draws.filter(draw=>!draw.publicCards.length).map(draw=>expandedDrawArrival(draw,draw.count-1)));
 for(const draw of draws) if(draw.publicCards.length && otherEnd) draw.delay=Math.max(draw.delay,otherEnd+.2);
 const drawEnd = Math.max(0,...draws.map(draw=>expandedDrawArrival(draw,draw.count-1)));
 const turnId = after?.phase !== "ended" && !after?.effect && after?.phase !== "drawn" && before?.currentPlayerId !== after?.currentPlayerId ? after?.currentPlayerId ?? null : null;
 const turnDelay = swap ? SWAP_DELAY + SWAP_DURATION + .15 : draws.length ? drawEnd + .2 : played ? .58 : 0;
 return { played, swap, draws, badges, turnId, turnLabel: turnId === frame.after.selfPlayerId ? "Đến lượt bạn!" : turnId ? "Đến lượt " + name(turnId) : "", turnDelay,
  duration: Math.max(swap ? SWAP_DELAY + SWAP_DURATION : 0, played ? .68 : .15, badges.length ? base + NOTICE_DURATION : 0, drawEnd, turnId ? turnDelay + NOTICE_DURATION : 0) };
}

export function publicDrawEnd(draw: ExpandedEffectPlan["draws"][number]): number {
 return draw.delay + draw.publicCards.length * draw.revealStep;
}
/** One timeline drives flight, hand/count arrival and turn notices on all clients. */
export function expandedDrawArrival(draw: ExpandedEffectPlan["draws"][number], index: number): number {
 if(index < draw.publicCards.length) return draw.delay + (index+1)*draw.revealStep;
 return publicDrawEnd(draw) + DRAW_DURATION + Math.min(index-draw.publicCards.length,7)*DRAW_STAGGER;
}

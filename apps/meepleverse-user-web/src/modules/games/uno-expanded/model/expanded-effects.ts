import type { UnoExpandedCard, UnoExpandedEvent, UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import type { UnoColor } from "@meepleverse/contracts/uno";
import { expandedCardName } from "./card-presentation";
import { DRAW_DURATION, DRAW_STAGGER, NOTICE_DURATION } from "../../uno/model/uno-effects";
export { DRAW_DURATION, DRAW_STAGGER, NOTICE_DURATION };
export interface ExpandedVisualFrame { id: string; matchId: string; revision: number; before: UnoExpandedRoomView; after: UnoExpandedRoomView; events: UnoExpandedEvent[] }
export interface ExpandedPresentation { frame: ExpandedVisualFrame; landed: boolean; arrived: Record<string, number> }
export interface ExpandedEffectPlan {
 played: Extract<UnoExpandedEvent, { type: "CARD_PLAYED" }> | undefined;
 draws: { playerId: string; count: number; cards: UnoExpandedCard[]; delay: number; context?: string }[];
 badges: { playerId: string | null; symbol: string; label: string; color?: UnoColor | null; tone: "skip" | "reverse" | "wild" | "uno" | "play" | "draw"; delay: number }[];
 turnId: string | null; turnLabel: string; turnDelay: number; duration: number;
}
export function planExpandedEffects(frame: ExpandedVisualFrame): ExpandedEffectPlan {
 const before = frame.before.game, after = frame.after.game;
 const name = (id: string) => frame.after.members.find(member => member.playerId === id)?.nickname ?? "Người chơi";
 const played = frame.events.find((event): event is NonNullable<ExpandedEffectPlan["played"]> => event.type === "CARD_PLAYED");
 const base = played ? .46 : .04;
 const badges: ExpandedEffectPlan["badges"] = [];
 if (played) {
  const kind = played.card.kind;
  const symbols: Partial<Record<UnoExpandedCard["kind"],string>> = { "draw-two":"+2", "wild-draw-four":"+4", "wild-target-four":"+4", "wild-draw-six":"+6", "wild-draw-eight":"+8" };
  const symbol = symbols[kind] ?? (kind === "number" ? String(played.card.value) : kind === "reverse" ? "↔" : kind === "skip" || kind === "skip-two" ? "⊘" : kind.includes("draw") ? "+" : kind === "wild-shield" ? "🛡" : kind === "wild-multiply-two" ? "×2" : kind === "wild-divide-two" ? "÷2" : "✦");
  const tone = kind === "reverse" ? "reverse" : kind === "skip" || kind === "skip-two" ? "skip" : kind.includes("draw") ? "draw" : kind === "number" ? "play" : "wild";
  // Mini-game panels already explain their activation; keep their response area clear.
  if (!after?.effect) badges.push({ playerId: played.playerId, symbol, tone, color: played.card.color ?? after?.activeColor, delay: base,
   label: name(played.playerId) + " đánh " + expandedCardName(played.card) + (frame.events.some(event => event.type === "UNO_CALLED" && event.playerId === played.playerId) ? " · UNO!" : "") });
 }
 const totals = new Map<string, number>();
 for (const event of frame.events) if (event.type === "CARDS_DRAWN") totals.set(event.playerId, (totals.get(event.playerId) ?? 0) + event.count);
 const reveal = frame.events.find(event => event.type === "RANDOM_REVEALED");
 if (reveal?.type === "RANDOM_REVEALED") {
  const badge = badges.find(item => item.playerId === played?.playerId);
  const detail = `Lật ${expandedCardName(reveal.card)} · ${name(reveal.playerId)} nhận ${totals.get(reveal.playerId) ?? 0} lá`;
  if (badge) badge.label += " · " + detail;
  else badges.push({ playerId: reveal.playerId, symbol: "+?", tone: "wild", color: after?.activeColor, delay: base, label: detail });
 }
 const oldIds = new Set(before?.self.hand.map(card => card.id));
 const draws = [...totals].filter(([,count]) => count > 0).map(([playerId,count]) => ({ playerId, count,
  cards: playerId === after?.self.playerId ? after.self.hand.filter(card => !oldIds.has(card.id)).slice(0,count) : [], delay: base + .12,
  context: frame.events.some(event => event.type === "UNO_PENALTY" && event.playerId === playerId) ? "Quên hô UNO" : undefined }));
 const drawEnd = Math.max(0,...draws.map(draw => draw.delay + DRAW_DURATION + Math.max(0,Math.min(draw.count,8)-1)*DRAW_STAGGER));
 const turnId = after?.phase !== "ended" && !after?.effect && after?.phase !== "drawn" && before?.currentPlayerId !== after?.currentPlayerId ? after?.currentPlayerId ?? null : null;
 const turnDelay = draws.length ? drawEnd + .2 : played ? .58 : 0;
 return { played, draws, badges, turnId, turnLabel: turnId === frame.after.selfPlayerId ? "Đến lượt bạn!" : turnId ? "Đến lượt " + name(turnId) : "", turnDelay,
  duration: Math.max(played ? .68 : .15, badges.length ? base + NOTICE_DURATION : 0, drawEnd, turnId ? turnDelay + NOTICE_DURATION : 0) };
}

import type { UnoCard, UnoEvent, UnoColor } from "@meepleverse/contracts/uno";
import type { UnoRoomView } from "@meepleverse/contracts/room";
import { cardName, cardSymbol, colorNames } from "./uno-view-state";
export interface UnoVisualFrame {
  id: string; matchId: string; revision: number;
  before: UnoRoomView; after: UnoRoomView; events: UnoEvent[];
}
export interface UnoPresentation { frame: UnoVisualFrame; landed: boolean; arrived: Record<string, number> }
export interface EffectBadge { color?: UnoColor | null; playerId: string | null; symbol: string; label: string; tone: "skip" | "draw" | "wild" | "reverse" | "uno" | "play"; delay: number }
export const NOTICE_DURATION = 2;
export const DRAW_DURATION = 1.85;
export const DRAW_STAGGER = .12;
export interface DrawFlight { playerId: string; count: number; cards: UnoCard[]; delay: number; context?: string }
export interface EffectPlan {
  played: Extract<UnoEvent, { type: "CARD_PLAYED" }> | undefined;
  draws: DrawFlight[]; badges: EffectBadge[]; turnId: string | null; turnLabel: string; turnDelay: number; duration: number;
}
export function planEffects(frame: UnoVisualFrame): EffectPlan {
  const before = frame.before.game;
  const after = frame.after.game;
  const name = (id: string) => frame.after.members.find(member => member.playerId === id)?.nickname ?? "Người chơi";
  const played = frame.events.find((event): event is Extract<UnoEvent, { type: "CARD_PLAYED" }> => event.type === "CARD_PLAYED");
  const playedLabel = played ? played.card.kind === "draw-two" ? colorNames[played.card.color!] + " +2" : played.card.kind === "wild-draw-four" ? "+4" : cardName(played.card) : "";
  const badges: EffectBadge[] = [];
  const base = played ? .46 : .04;
  if (played && before) {
    if (played.card.kind !== "reverse" && played.card.kind !== "wild" && played.card.kind !== "skip" && played.card.kind !== "wild-draw-four" && !frame.events.some(event => event.type === "UNO_CALLED" && event.playerId === played.playerId)) badges.push({ playerId: played.playerId, symbol: played.card.kind === "number" ? cardSymbol(played.card) : "↗", label: name(played.playerId) + " đánh " + playedLabel, tone: "play", delay: base });
    const index = before.players.findIndex(player => player.playerId === played.playerId);
    const next = before.players[(index + before.direction + before.players.length) % before.players.length]?.playerId;
    if (next && played.card.kind === "skip") {
      badges.push({ playerId: next, symbol: "⊘", label: name(played.playerId) + " đánh " + playedLabel + " · " + name(next) + " mất lượt", tone: "skip", delay: base });
    }
    if (played.card.kind === "reverse") badges.push({ playerId: played.playerId, symbol: "⇄", label: before.players.length === 2 ? "Đảo chiều · " + name(played.playerId) + " được chơi tiếp" : name(played.playerId) + " · Đảo chiều!", tone: "reverse", delay: base });
    if (played.card.kind === "wild") badges.push({ playerId: played.playerId, symbol: "✦", label: name(played.playerId) + " · Chọn " + (after?.activeColor ? colorNames[after.activeColor] : "màu mới"), tone: "wild", delay: base });
    if (played.card.kind === "wild-draw-four") badges.push({ playerId: played.playerId, symbol: "+4", label: name(played.playerId) + " đánh +4" + (after?.pendingDraw ? " · Tổng +" + after.pendingDraw : ""), tone: "draw", delay: base });
  }
  for (const badge of badges) badge.color = played?.card.color ?? after?.activeColor;
  const draws: DrawFlight[] = [];
  for (const event of frame.events) {
    if (event.type === "CARDS_DRAWN" && event.count > 0) {
      const oldIds = new Set(before?.self.hand.map(card => card.id));
      const cards = event.playerId === after?.self.playerId ? after.self.hand.filter(card => !oldIds.has(card.id)).slice(0, event.count) : [];
      draws.push({ playerId: event.playerId, count: event.count, cards, delay: base + .12 });
    }
    if (event.type === "COLOR_CHOSEN") badges.push({ playerId: event.playerId, symbol: "✦", label: name(event.playerId) + " · Chọn " + colorNames[event.color], color: event.color, tone: "wild", delay: base });
    if (event.type === "UNO_CALLED") {
      const skip = played?.card.kind === "skip" && played.playerId === event.playerId ? badges.find(badge => badge.tone === "skip") : undefined;
      if (skip) skip.label += " · UNO!";
      else badges.push({ playerId: event.playerId, symbol: "UNO!", label: played?.playerId === event.playerId ? name(event.playerId) + " đánh " + playedLabel + " · UNO!" : name(event.playerId) + " hô UNO!", tone: "uno", delay: base });
    }
  }
  for (const draw of draws) if (frame.events.some(event => event.type === "UNO_PENALTY" && event.playerId === draw.playerId)) draw.context = "Quên hô UNO";
  // A card effect and an UNO declaration from the same player share one bubble.
  for (let index = badges.length - 1; index >= 0; index--) {
    const badge = badges[index]!;
    if (badge.tone !== "uno") continue;
    const action = badges.find(other => other !== badge && other.playerId === badge.playerId && (other.tone === "reverse" || other.tone === "wild" || other.tone === "play" || other.tone === "draw"));
    if (action) { action.label += " · UNO!"; badges.splice(index, 1); }
  }
  const drawEnd = draws.reduce((end, draw) => Math.max(end, draw.delay + DRAW_DURATION + Math.max(0, draw.count - 1) * DRAW_STAGGER), 0);
  const actionEnd = Math.max(played ? .68 : 0, badges.length ? base + NOTICE_DURATION : 0, drawEnd);
  const turnId = after?.phase === "ended" ? null : after?.currentPlayerId ?? null;
  const announce = !!turnId && after?.phase !== "drawn" && after?.phase !== "penalty-color" && !(played?.card.kind === "reverse" && before?.players.length === 2) && (frame.id.startsWith("intro:") || played || draws.length || before?.currentPlayerId !== turnId || before?.phase !== after?.phase);
  const badgeEnd = badges.length ? Math.max(...badges.map(badge => badge.delay + NOTICE_DURATION)) : 0;
  const turnDelay = draws.length ? Math.max(drawEnd, badgeEnd) + .2 : played ? .58 : 0;
  return {
    played, draws, badges, turnId: announce ? turnId : null,
    turnLabel: turnId ? after?.phase === "draw-stack" ? name(turnId) + " · Cộng tiếp hoặc nhận " + after.pendingDraw + " lá" : after?.phase === "drawn" ? name(turnId) + " · Đánh lá vừa bốc?" : "Đến lượt " + name(turnId) : "",
    turnDelay, duration: Math.max(actionEnd, announce ? turnDelay + NOTICE_DURATION : 0, .15),
  };
}

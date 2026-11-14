import { discardPlacement } from "../../model/discard-layout";
import type { UnoVisualFrame } from "../../model/uno-effects";
export interface Point { x: number; y: number }
export interface EffectGeometry {
  deck: Point; discard: Point; turn: Point; width: number; height: number;
  notices: Map<string, Point>; players: Map<string, Point>; cardOrigins: Map<string, Point>;
}
export interface GeometryCache { cards: Map<string, Point>; players: Map<string, Point>; deck?: Point; discard?: Point }
function center(element: Element | null): Point | undefined {
  if (!element) return;
  const rect = element.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
export function cacheGeometry(cache: GeometryCache, selfId: string): void {
  document.querySelectorAll<HTMLElement>(".uno-hand-card").forEach(element => {
    if (element.dataset.cardId) cache.cards.set(element.dataset.cardId, center(element)!);
  });
  document.querySelectorAll<HTMLElement>(".opponent[data-player-id]").forEach(element => {
    if (element.dataset.playerId) cache.players.set(element.dataset.playerId, center(element.querySelector(".opponent-hand")) ?? center(element)!);
  });
  const hand = center(document.querySelector(".hand-scroll"));
  if (hand) cache.players.set(selfId, hand);
  cache.deck = center(document.querySelector(".draw-pile")) ?? cache.deck;
  cache.discard = center(document.querySelector(".discard-stack")) ?? cache.discard;
}
export function effectGeometry(cache: GeometryCache, frame: UnoVisualFrame): EffectGeometry {
  cacheGeometry(cache, frame.after.selfPlayerId);
  const pile = document.querySelector(".discard-stack")?.getBoundingClientRect();
  const width = pile?.width ?? (innerWidth <= 640 ? 60 : 82);
  const height = pile?.height ?? Math.round(width * 1.45);
  const top = frame.after.game?.topCard;
  const placement = top ? discardPlacement(top.id) : { x: 0, y: 0 };
  const base = cache.discard ?? { x: innerWidth / 2, y: innerHeight * .43 };
  const table = document.querySelector(".uno-table")?.getBoundingClientRect();
  const notices = new Map<string, Point>();
  document.querySelectorAll<HTMLElement>(".opponent[data-player-id]").forEach(element => {
    const rect = (element.querySelector(".opponent-identity") ?? element).getBoundingClientRect();
    if (element.dataset.playerId) notices.set(element.dataset.playerId, { x: rect.left + rect.width / 2, y: rect.bottom + 14 });
  });
  const hand = document.querySelector(".uno-hand")?.getBoundingClientRect();
  if (hand) notices.set(frame.after.selfPlayerId, { x: innerWidth / 2, y: hand.top + 4 });
  return {
    notices, deck: cache.deck ?? { x: innerWidth / 2 - 45, y: innerHeight * .43 },
    discard: { x: base.x + width * placement.x / 100, y: base.y + height * placement.y / 100 },
    turn: { x: innerWidth / 2, y: Math.min(innerHeight - 125, table ? table.bottom - 22 : innerHeight * .6) },
    width, height, players: new Map(cache.players), cardOrigins: new Map(cache.cards),
  };
}
export function playerPoint(geometry: EffectGeometry, playerId: string | null): Point {
  const point = playerId ? geometry.players.get(playerId) : undefined;
  return point ?? { x: innerWidth / 2, y: geometry.discard.y - 80 };
}

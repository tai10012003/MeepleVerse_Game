import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import type { UnoExpandedEvents } from "../events/uno-expanded-events.js";
import type { HandChangePlan } from "./prepare-hand-change.js";
/** The activation card is already on top. Only colored discards reveal their accompanying faces. */
export function applyHandChange(game: UnoExpandedGame, actorId: string, plan: HandChangePlan, events: UnoExpandedEvents): void {
  if (plan.kind === "single") return;
  const actor = game.players.find(player => player.id === actorId)!;
  const ids = new Set(plan.cards.map(card => card.id));
  actor.hand = actor.hand.filter(card => !ids.has(card.id));
  if (plan.kind === "divide") {
    // drawPile.pop() draws from the top: reverse the canonical hand order at the bottom.
    game.drawPile.unshift(...[...plan.cards].reverse());
    events.public.push({ type: "HAND_REDUCED", playerId: actorId, count: plan.cards.length });
  } else {
    game.discardPile.splice(game.discardPile.length - 1, 0, ...plan.cards);
    events.public.push({ type: "COLOR_DISCARDED", playerId: actorId, color: plan.color!, cards: structuredClone(plan.cards) });
  }
}

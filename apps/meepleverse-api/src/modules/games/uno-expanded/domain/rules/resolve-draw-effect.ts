import type { UnoExpandedCard } from "@meepleverse/contracts/uno-expanded";
import type { RandomSource } from "../../../uno-common/index.js";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import type { UnoExpandedEvents } from "../events/uno-expanded-events.js";
import { drawExpandedCards, takeExpandedCards } from "./draw-cards.js";
export function resolveExpandedDrawEffect(game: UnoExpandedGame, card: UnoExpandedCard, actorId: string, targetIndex: number, random: RandomSource, events: UnoExpandedEvents): boolean {
  const target = game.players[targetIndex]!;
  let count = 0;
  switch (card.kind) {
    case "tornado": {
      // Every physical card can enter this hand at most once. No matching color => finite exhaustion.
      const revealed: UnoExpandedCard[] = [];
      const available = game.drawPile.length + Math.max(0, game.discardPile.length - 1);
      for (let i = 0; i < available; i++) {
        const [drawn] = takeExpandedCards(game, target.id, 1, random);
        if (!drawn) break;
        revealed.push(structuredClone(drawn));
        count++;
        if (drawn.color === card.color) break;
      }
      if (revealed.length) events.public.push({ type: "TORNADO_REVEALED", playerId: target.id, color: card.color, cards: revealed });
      events.public.push({ type: "CARDS_DRAWN", playerId: target.id, count, reason: "tornado" });
      break;
    }
    case "wild-random": {
      const [reveal] = drawExpandedCards(game, target.id, 1, random, events, "random-reveal");
      if (reveal) {
        count = 1;
        events.public.push({ type: "RANDOM_REVEALED", playerId: target.id, card: structuredClone(reveal) });
        if (reveal.kind === "number") count += drawExpandedCards(game, target.id, reveal.value, random, events, "random-extra").length;
      }
      break;
    }
    case "wild-multiply-two": {
      const before = target.hand.length;
      count = drawExpandedCards(game, target.id, before, random, events, "multiply").length;
      break;
    }
    default: return false;
  }
  events.public.push({ type: "DRAW_EFFECT_RESOLVED", actorId, playerId: target.id, kind: card.kind, count });
  return true;
}

import type { UnoExpandedDrawReason } from "@meepleverse/contracts/uno-expanded";
import { drawFromStock, shuffle, type RandomSource } from "../../../uno-common/index.js";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import type { UnoExpandedEvents } from "../events/uno-expanded-events.js";
import { requireExpanded, UnoExpandedRuleError } from "../errors/uno-expanded.errors.js";
export function takeExpandedCards(game: UnoExpandedGame, playerId: string, count: number, random: RandomSource) {
  const player = game.players.find(player => player.id === playerId);
  requireExpanded(player, "UNKNOWN_PLAYER");
  return drawFromStock(game, player.hand, count, cards => shuffle(cards, random, () => { throw new UnoExpandedRuleError("INVALID_RANDOM"); }));
}
export function drawExpandedCards(game: UnoExpandedGame, playerId: string, count: number, random: RandomSource, events: UnoExpandedEvents, reason: UnoExpandedDrawReason) {
  const cards = takeExpandedCards(game, playerId, count, random);
  events.public.push({ type: "CARDS_DRAWN", playerId, count: cards.length, reason });
  return cards;
}

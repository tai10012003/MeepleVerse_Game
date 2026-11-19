import type { UnoGame } from "../models/uno-game.js";
import type { UnoEvents } from "../events/uno-event.js";
import type { Card } from "../models/card.js";
import { drawFromStock } from "../../../uno-common/index.js";
import { shuffle, type RandomSource } from "./shuffle.js";

export function drawCards(game: UnoGame, playerId: string, count: number, random: RandomSource, events: UnoEvents): Card[] {
  const player = game.players.find(player => player.id === playerId)!;
  const drawn = drawFromStock(game, player.hand, count, cards => shuffle(cards, random));
  events.public.push({ type: "CARDS_DRAWN", playerId, count: drawn.length });
  return drawn;
}

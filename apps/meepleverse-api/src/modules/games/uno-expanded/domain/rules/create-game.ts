import type { UnoExpandedCard } from "@meepleverse/contracts/uno-expanded";
import { drawFromStock, getNextPlayer, randomIndex, shuffle, type RandomSource } from "../../../uno-common/index.js";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import { requireExpanded, UnoExpandedRuleError } from "../errors/uno-expanded.errors.js";
import { createExpandedDeck } from "./create-deck.js";
const invalidRandom = () => { throw new UnoExpandedRuleError("INVALID_RANDOM"); };
export function createExpandedGame(playerIds: readonly string[], random: RandomSource = Math.random, dealerIndex?: number): UnoExpandedGame {
  requireExpanded(playerIds.length >= 2 && playerIds.length <= 4 &&
    playerIds.every(id => typeof id === "string" && id.trim().length > 0 && id.length <= 100) &&
    new Set(playerIds).size === playerIds.length, "INVALID_SETUP");
  const dealer = dealerIndex ?? randomIndex(playerIds.length, random, invalidRandom);
  requireExpanded(Number.isInteger(dealer) && dealer >= 0 && dealer < playerIds.length, "INVALID_SETUP");
  const piles = { drawPile: shuffle(createExpandedDeck(), random, invalidRandom), discardPile: [] as UnoExpandedCard[] };
  const players = playerIds.map(id => ({ id, hand: [] as UnoExpandedCard[] }));
  for (let round = 0; round < 7; round++) {
    for (let seat = 1; seat <= players.length; seat++) {
      drawFromStock(piles, players[getNextPlayer(dealer, players.length, 1, seat)]!.hand, 1, cards => shuffle(cards, random, invalidRandom));
    }
  }
  const returned: UnoExpandedCard[] = [];
  let opening = piles.drawPile.pop();
  while (opening && opening.kind !== "number") { returned.push(opening); opening = piles.drawPile.pop(); }
  requireExpanded(opening?.kind === "number", "INVALID_SETUP");
  if (returned.length) piles.drawPile = shuffle([...piles.drawPile, ...returned], random, invalidRandom);
  piles.discardPile = [opening];
  return { gameId: "uno-expanded", rulesVersion: "uno-expanded-v1", revision: 0, phase: "prepared",
    players, dealerIndex: dealer, direction: 1, activeColor: opening.color, ...piles };
}

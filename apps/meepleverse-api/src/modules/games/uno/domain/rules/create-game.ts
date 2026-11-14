import { requireRule } from "../errors/uno.errors.js";
import type { UnoGame } from "../models/uno-game.js";
import { createDeck } from "./create-deck.js";
import { randomIndex, shuffle, type RandomSource } from "./shuffle.js";
import { getNextPlayer } from "./get-next-player.js";
import { drawCards } from "./draw-cards.js";
export function createGame(playerIds: readonly string[], random: RandomSource = Math.random, dealerIndex?: number): UnoGame {
  requireRule(playerIds.length >= 2 && playerIds.length <= 4 &&
    playerIds.every(id => typeof id === "string" && id.trim().length > 0 && id.length <= 100) &&
    new Set(playerIds).size === playerIds.length, "INVALID_SETUP");
  const dealer = dealerIndex ?? randomIndex(playerIds.length, random);
  requireRule(Number.isInteger(dealer) && dealer >= 0 && dealer < playerIds.length, "INVALID_SETUP");
  const game: UnoGame = {
    rulesVersion: "uno-house-v3", revision: 0, phase: "turn",
    players: playerIds.map(id => ({ id, hand: [] })), dealerIndex: dealer,
    currentIndex: getNextPlayer(dealer, playerIds.length, 1), direction: 1,
    activeColor: null, drawPile: shuffle(createDeck(), random), discardPile: [],
    drawnCardId: null, pendingDraw: 0,
    blockedTurns: 0, result: null,
  };
  const events = { public: [] };
  for (let round = 0; round < 7; round++) {
    for (let seat = 1; seat <= playerIds.length; seat++) {
      drawCards(game, game.players[getNextPlayer(dealer, playerIds.length, 1, seat)]!.id, 1, random, events);
    }
  }
  // Open with a number only; return all skipped action cards to the shuffled stock.
  const returned = [];
  let opening = game.drawPile.pop()!;
  while (opening.kind !== "number") {
    returned.push(opening);
    opening = game.drawPile.pop()!;
  }
  if (returned.length) game.drawPile = shuffle([...game.drawPile, ...returned], random);
  game.discardPile = [opening];
  game.activeColor = opening.color;
  return game;
}

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
    rulesVersion: "uno-basic-v1", revision: 0, phase: "turn",
    players: playerIds.map(id => ({ id, hand: [] })), dealerIndex: dealer,
    currentIndex: getNextPlayer(dealer, playerIds.length, 1), direction: 1,
    activeColor: null, drawPile: shuffle(createDeck(), random), discardPile: [],
    drawnCardId: null, unoTargetId: null, pendingDrawFour: null,
    pendingWinnerId: null, blockedTurns: 0, result: null,
  };
  const events = { public: [], private: [] };
  for (let round = 0; round < 7; round++) {
    for (let seat = 1; seat <= playerIds.length; seat++) {
      drawCards(game, game.players[getNextPlayer(dealer, playerIds.length, 1, seat)]!.id, 1, random, events);
    }
  }
  // Set aside initial Draw Fours, then return them to the shuffled stock.
  const returned = [];
  let opening = game.drawPile.pop()!;
  while (opening.kind === "wild-draw-four") {
    returned.push(opening);
    opening = game.drawPile.pop()!;
  }
  if (returned.length) game.drawPile = shuffle([...game.drawPile, ...returned], random);
  game.discardPile = [opening];
  game.activeColor = opening.color;
  if (opening.kind === "wild") game.phase = "choose-color";
  if (opening.kind === "reverse") {
    game.direction = -1;
    game.currentIndex = dealer;
  }
  if (opening.kind === "skip" || opening.kind === "draw-two") {
    if (opening.kind === "draw-two") drawCards(game, game.players[game.currentIndex]!.id, 2, random, events);
    game.currentIndex = getNextPlayer(game.currentIndex, playerIds.length, 1);
  }
  return game;
}

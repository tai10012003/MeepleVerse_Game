import type { UnoCommand } from "@meepleverse/contracts/uno";
import type { UnoGame } from "../models/uno-game.js";
import type { UnoEvents } from "../events/uno-event.js";
import { requireRule } from "../errors/uno.errors.js";
import { canPlayCard } from "./can-play-card.js";
import { getNextPlayer } from "./get-next-player.js";
import { drawCards } from "./draw-cards.js";
import { endGame } from "./scoring.js";
import type { RandomSource } from "./shuffle.js";
export function playCard(game: UnoGame, actorId: string, command: Extract<UnoCommand, { type: "PLAY_CARD" }>, random: RandomSource, events: UnoEvents): void {
  requireRule(game.phase === "turn" || game.phase === "drawn" || game.phase === "draw-stack", "INVALID_PHASE");
  const actor = game.players[game.currentIndex]!;
  const index = actor.hand.findIndex(card => card.id === command.cardId);
  requireRule(index !== -1, "CARD_NOT_OWNED");
  const card = actor.hand[index]!;
  requireRule(game.phase !== "drawn" || game.drawnCardId === card.id, "DRAWN_CARD_ONLY");
  const penaltyCard = card.kind === "draw-two" || card.kind === "wild-draw-four";
  requireRule(game.phase === "draw-stack" ? penaltyCard : canPlayCard(card, game.discardPile.at(-1)!, game.activeColor!), "CARD_NOT_PLAYABLE");
  requireRule(card.kind === "wild" ? command.chosenColor !== undefined : command.chosenColor === undefined, "INVALID_COLOR");
  requireRule(!command.declareUno || actor.hand.length === 2, "INVALID_UNO_CALL");
  actor.hand.splice(index, 1);
  game.discardPile.push(card);
  game.activeColor = card.kind === "wild-draw-four" ? null : card.color ?? command.chosenColor!;
  game.drawnCardId = null;
  game.phase = "turn";
  game.blockedTurns = 0;
  events.public.push({ type: "CARD_PLAYED", playerId: actorId, card: structuredClone(card) });
  if (actor.hand.length === 1) {
    if (command.declareUno) events.public.push({ type: "UNO_CALLED", playerId: actorId });
    else {
      events.public.push({ type: "UNO_PENALTY", playerId: actorId });
      drawCards(game, actorId, 2, random, events);
    }
  }
  const next = getNextPlayer(game.currentIndex, game.players.length, game.direction);
  if (penaltyCard) {
    game.pendingDraw += card.kind === "draw-two" ? 2 : 4;
    game.currentIndex = next;
    game.phase = "draw-stack";
    if (actor.hand.length === 0) {
      drawCards(game, game.players[next]!.id, game.pendingDraw, random, events);
      endGame(game, actorId, events);
    }
    return;
  }
  let steps = 1;
  if (card.kind === "reverse") {
    game.direction = game.direction === 1 ? -1 : 1;
    if (game.players.length === 2) steps = 2;
  }
  if (card.kind === "skip") steps = 2;
  game.currentIndex = getNextPlayer(game.currentIndex, game.players.length, game.direction, steps);
  if (actor.hand.length === 0) endGame(game, actorId, events);
}

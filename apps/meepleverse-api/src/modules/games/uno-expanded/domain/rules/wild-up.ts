import type { UnoExpandedCommand, UnoExpandedCard } from "@meepleverse/contracts/uno-expanded";
import { getNextPlayer, type RandomSource } from "../../../uno-common/index.js";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import type { UnoExpandedEvents } from "../events/uno-expanded-events.js";
import { requireExpanded } from "../errors/uno-expanded.errors.js";
import { numericValue, nextEffectId, finishEffect, requireEffect } from "./effect-helpers.js";
import { drawExpandedCards } from "./draw-cards.js";
import { resolveExpandedUno } from "./resolve-uno.js";
import { endExpandedGame } from "./scoring.js";
export function canAnswerUp(game: UnoExpandedGame, card: UnoExpandedCard): boolean {
  const effect = game.effect; const value = numericValue(card);
  return effect?.kind === "up" && value !== null && (effect.lastValue === null ? card.color === effect.openingColor : value >= effect.lastValue);
}
function advanceUp(game: UnoExpandedGame, random: RandomSource, events: UnoExpandedEvents): void {
  const effect = game.effect; requireExpanded(effect?.kind === "up", "INVALID_PHASE");
  const player = game.players[game.currentIndex]!;
  if (player.hand.some(card => canAnswerUp(game, card))) return;
  const cards = drawExpandedCards(game, player.id, effect.lastValue ?? 1, random, events, "up");
  events.public.push({ type: "UP_ENDED", effectId: effect.id, playerId: player.id, count: cards.length });
  finishEffect(game, getNextPlayer(game.currentIndex, game.players.length, game.direction));
}
export function startUp(game: UnoExpandedGame, actorId: string, random: RandomSource, events: UnoExpandedEvents): void {
  const resumeIndex = getNextPlayer(game.currentIndex, game.players.length, game.direction);
  game.effect = { kind: "up", id: nextEffectId(game), actorId, openingColor: game.activeColor, lastValue: null, resumeIndex };
  game.phase = "up"; game.currentIndex = resumeIndex;
  events.public.push({ type: "EFFECT_STARTED", effectId: game.effect.id, kind: "up", actorId });
  advanceUp(game, random, events);
}
export function answerUp(game: UnoExpandedGame, actorId: string, command: Extract<UnoExpandedCommand, { type: "UP_PLAY" }>, random: RandomSource, events: UnoExpandedEvents): void {
  requireEffect(game, command.effectId); requireExpanded(game.effect?.kind === "up" && game.phase === "up", "INVALID_PHASE");
  requireExpanded(game.players[game.currentIndex]!.id === actorId, "NOT_YOUR_TURN");
  const player = game.players[game.currentIndex]!; const index = player.hand.findIndex(card => card.id === command.cardId);
  requireExpanded(index >= 0, "CARD_NOT_OWNED"); const card = player.hand[index]!;
  requireExpanded(canAnswerUp(game, card), "CARD_NOT_PLAYABLE");
  const requiresUno = player.hand.length === 2;
  requireExpanded(!command.declareUno || requiresUno, "INVALID_UNO_CALL");
  player.hand.splice(index, 1); game.discardPile.push(card); game.activeColor = card.color!;
  game.effect.lastValue = numericValue(card); game.drawnCardId = null; game.blockedTurns = 0;
  events.public.push({ type: "CARD_PLAYED", playerId: actorId, card: structuredClone(card) });
  resolveExpandedUno(game, actorId, requiresUno, command.declareUno === true, random, events);
  if (player.hand.length === 0) { endExpandedGame(game, actorId, events); return; }
  game.currentIndex = getNextPlayer(game.currentIndex, game.players.length, game.direction);
  advanceUp(game, random, events);
}

import type { UnoExpandedCommand, UnoExpandedCard, BattleRevealedCard } from "@meepleverse/contracts/uno-expanded";
import { getNextPlayer, type RandomSource } from "../../../uno-common/index.js";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import type { UnoExpandedEvents } from "../events/uno-expanded-events.js";
import type { BattleEffect } from "../models/effects.js";
import type { EffectContext } from "../models/effect-context.js";
import { requireExpanded } from "../errors/uno-expanded.errors.js";
import { numericValue, nextEffectId, finishEffect, requireEffect } from "./effect-helpers.js";
import { drawExpandedCards } from "./draw-cards.js";
import { resolveExpandedUno } from "./resolve-uno.js";
import { endExpandedGame } from "./scoring.js";
export function battleEligibleCards(game: UnoExpandedGame, playerId: string, effect: BattleEffect): UnoExpandedCard[] {
  return game.players.find(player => player.id === playerId)!.hand.filter(card => card.color === effect.color && numericValue(card) !== null);
}
function placeUnderBattle(game: UnoExpandedGame, effect: BattleEffect, cards: UnoExpandedCard[]): void {
  requireExpanded(game.discardPile.at(-1)?.id === effect.anchorCardId, "INVALID_PHASE");
  game.discardPile.splice(game.discardPile.length - 1, 0, ...cards);
}
function finishBattle(game: UnoExpandedGame, effect: BattleEffect, events: UnoExpandedEvents): void {
  events.public.push({ type: "BATTLE_RESOLVED", effectId: effect.id, winnerId: effect.winnerId });
  const empty = [effect.actorId, effect.targetId].filter(id => game.players.find(player => player.id === id)!.hand.length === 0);
  if (effect.winnerId && empty.includes(effect.winnerId)) endExpandedGame(game, effect.winnerId, events);
  else if (empty.length > 1) endExpandedGame(game, null, events, "simultaneous-finish");
  else if (empty.length === 1) endExpandedGame(game, empty[0]!, events);
  else finishEffect(game, effect.resumeIndex);
}
function resolveChoices(game: UnoExpandedGame, effect: BattleEffect, context: EffectContext, random: RandomSource, events: UnoExpandedEvents): void {
  const ids = [effect.actorId, effect.targetId];
  const revealed: BattleRevealedCard[] = [];
  const uno: Array<{ playerId: string; requires: boolean; declared: boolean }> = [];
  for (const id of ids) {
    const choice = effect.choices.find(choice => choice.playerId === id);
    if (!choice) continue;
    const player = game.players.find(player => player.id === id)!;
    const index = player.hand.findIndex(card => card.id === choice.cardId);
    requireExpanded(index >= 0, "CARD_NOT_OWNED");
    uno.push({ playerId: id, requires: player.hand.length === 2, declared: choice.declareUno });
    revealed.push({ playerId: id, card: player.hand.splice(index, 1)[0]! });
  }
  placeUnderBattle(game, effect, revealed.map(entry => entry.card));
  effect.revealed = structuredClone(revealed);
  if (revealed.length === 1) effect.winnerId = revealed[0]!.playerId;
  else if (revealed.length === 2) {
    const a = numericValue(revealed[0]!.card)!; const b = numericValue(revealed[1]!.card)!;
    if (a !== b) effect.winnerId = revealed[a > b ? 0 : 1]!.playerId;
  }
  events.public.push({ type: "BATTLE_REVEALED", effectId: effect.id, cards: structuredClone(revealed), winnerId: effect.winnerId });
  // Capture each active reduction before any UNO or Battle draw can hide a two-to-one transition.
  for (const entry of uno) resolveExpandedUno(game, entry.playerId, entry.requires, entry.declared, random, events);
  if (!revealed.length) {
    drawExpandedCards(game, effect.actorId, 3, random, events, "battle");
    drawExpandedCards(game, effect.targetId, 2, random, events, "battle");
  } else if (effect.winnerId) {
    const loserId = ids.find(id => id !== effect.winnerId)!;
    drawExpandedCards(game, loserId, 2, random, events, "battle");
  }
  if (effect.winnerId) {
    const winner = game.players.find(player => player.id === effect.winnerId)!;
    effect.rewardCount = Math.min(2, winner.hand.length);
    if (effect.rewardCount > 0) {
      effect.stage = "reward"; effect.deadline = context.now + context.timing.battleChoiceMs; effect.remainingMs = null;
      game.phase = "battle-discard"; game.currentIndex = game.players.indexOf(winner); return;
    }
  }
  finishBattle(game, effect, events);
}
export function startBattle(game: UnoExpandedGame, actorId: string, targetIndex: number, context: EffectContext, random: RandomSource, events: UnoExpandedEvents): void {
  const effect: BattleEffect = { kind: "battle", id: nextEffectId(game), actorId, targetId: game.players[targetIndex]!.id,
    color: game.activeColor, anchorCardId: game.discardPile.at(-1)!.id, resumeIndex: getNextPlayer(game.currentIndex, game.players.length, game.direction),
    stage: "select", deadline: context.now + context.timing.battleChoiceMs, remainingMs: null,
    eligiblePlayerIds: [], choices: [], winnerId: null, rewardCount: 0, revealed: [] };
  game.effect = effect; game.phase = "battle-select";
  effect.eligiblePlayerIds = [actorId, effect.targetId].filter(id => battleEligibleCards(game, id, effect).length > 0);
  events.public.push({ type: "EFFECT_STARTED", effectId: effect.id, kind: "battle", actorId });
  if (!effect.eligiblePlayerIds.length) resolveChoices(game, effect, context, random, events);
}
export function answerBattle(game: UnoExpandedGame, actorId: string, command: Extract<UnoExpandedCommand, { type: "BATTLE_SELECT" }>, context: EffectContext, random: RandomSource, events: UnoExpandedEvents): void {
  requireEffect(game, command.effectId); const effect = game.effect;
  requireExpanded(effect?.kind === "battle" && effect.stage === "select" && game.phase === "battle-select", "INVALID_PHASE");
  requireExpanded(effect.eligiblePlayerIds.includes(actorId), "NOT_YOUR_TURN");
  requireExpanded(!effect.choices.some(choice => choice.playerId === actorId), "ALREADY_RESPONDED");
  requireExpanded(effect.deadline !== null && context.now < effect.deadline, "EFFECT_EXPIRED");
  requireExpanded(battleEligibleCards(game, actorId, effect).some(card => card.id === command.cardId), "CARD_NOT_PLAYABLE");
  const player = game.players.find(player => player.id === actorId)!;
  requireExpanded(!command.declareUno || player.hand.length === 2, "INVALID_UNO_CALL");
  effect.choices.push({ playerId: actorId, cardId: command.cardId, declareUno: command.declareUno === true });
  if (effect.choices.length === effect.eligiblePlayerIds.length) resolveChoices(game, effect, context, random, events);
}
function applyBattleReward(game: UnoExpandedGame, effect: BattleEffect, actorId: string, cardIds: string[], declared: boolean, random: RandomSource, events: UnoExpandedEvents): void {
  const player = game.players.find(player => player.id === actorId)!; const ids = new Set(cardIds);
  requireExpanded(cardIds.length === effect.rewardCount && ids.size === cardIds.length && cardIds.every(id => player.hand.some(card => card.id === id)), "INVALID_SELECTION");
  const requiresUno = player.hand.length >= 2 && player.hand.length - ids.size === 1;
  requireExpanded(!declared || requiresUno, "INVALID_UNO_CALL");
  const cards = player.hand.filter(card => ids.has(card.id)); player.hand = player.hand.filter(card => !ids.has(card.id));
  placeUnderBattle(game, effect, cards);
  events.public.push({ type: "BATTLE_REWARD_DISCARDED", effectId: effect.id, playerId: actorId, cards: structuredClone(cards) });
  resolveExpandedUno(game, actorId, requiresUno, declared, random, events);
  finishBattle(game, effect, events);
}
export function answerBattleReward(game: UnoExpandedGame, actorId: string, command: Extract<UnoExpandedCommand, { type: "BATTLE_DISCARD" }>, context: EffectContext, random: RandomSource, events: UnoExpandedEvents): void {
  requireEffect(game, command.effectId); const effect = game.effect;
  requireExpanded(effect?.kind === "battle" && effect.stage === "reward" && game.phase === "battle-discard", "INVALID_PHASE");
  requireExpanded(effect.winnerId === actorId, "NOT_YOUR_TURN");
  requireExpanded(effect.deadline !== null && context.now < effect.deadline, "EFFECT_EXPIRED");
  applyBattleReward(game, effect, actorId, command.cardIds, command.declareUno === true, random, events);
}
export function timeoutBattle(game: UnoExpandedGame, context: EffectContext, random: RandomSource, events: UnoExpandedEvents): void {
  const effect = game.effect; requireExpanded(effect?.kind === "battle", "INVALID_PHASE");
  events.public.push({ type: "EFFECT_TIMEOUT", effectId: effect.id, stage: effect.stage });
  if (effect.stage === "select") {
    for (const id of effect.eligiblePlayerIds) if (!effect.choices.some(choice => choice.playerId === id)) {
      const card = battleEligibleCards(game, id, effect)[0]!;
      effect.choices.push({ playerId: id, cardId: card.id, declareUno: false });
    }
    resolveChoices(game, effect, context, random, events);
  } else {
    const player = game.players.find(player => player.id === effect.winnerId)!;
    applyBattleReward(game, effect, player.id, player.hand.slice(0, effect.rewardCount).map(card => card.id), false, random, events);
  }
}

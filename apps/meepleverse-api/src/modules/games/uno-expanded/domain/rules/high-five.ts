import type { UnoExpandedCommand } from "@meepleverse/contracts/uno-expanded";
import { getNextPlayer, type RandomSource } from "../../../uno-common/index.js";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import type { UnoExpandedEvents } from "../events/uno-expanded-events.js";
import type { EffectContext } from "../models/effect-context.js";
import { requireExpanded } from "../errors/uno-expanded.errors.js";
import { nextEffectId, finishEffect, requireEffect } from "./effect-helpers.js";
import { drawExpandedCards } from "./draw-cards.js";
export function finishHighFive(game: UnoExpandedGame, random: RandomSource, events: UnoExpandedEvents): void {
  const effect = game.effect; requireExpanded(effect?.kind === "high-five", "INVALID_PHASE");
  const victim = effect.eligiblePlayerIds.find(id => !effect.responseOrder.includes(id)) ?? effect.responseOrder.at(-1)!;
  const cards = drawExpandedCards(game, victim, 2, random, events, "high-five");
  events.public.push({ type: "HIGH_FIVE_RESOLVED", effectId: effect.id, playerId: victim, count: cards.length });
  finishEffect(game, effect.resumeIndex);
}
export function startHighFive(game: UnoExpandedGame, actorId: string, context: EffectContext, random: RandomSource, events: UnoExpandedEvents): void {
  const eligiblePlayerIds = Array.from({ length: game.players.length - 1 }, (_, i) => game.players[getNextPlayer(game.currentIndex, game.players.length, game.direction, i + 1)]!.id);
  const opensAt = context.now + context.timing.highFivePrepareMs;
  game.effect = { kind: "high-five", id: nextEffectId(game), actorId, resumeIndex: getNextPlayer(game.currentIndex, game.players.length, game.direction),
    stage: "preparing", attempt: 1, opensAt, deadline: opensAt + context.timing.highFiveWindowMs, remainingMs: null, eligiblePlayerIds, responseOrder: [] };
  game.phase = "high-five";
  events.public.push({ type: "EFFECT_STARTED", effectId: game.effect.id, kind: "high-five", actorId });
  if (game.players.length === 2) finishHighFive(game, random, events);
}
export function answerHighFive(game: UnoExpandedGame, actorId: string, command: Extract<UnoExpandedCommand, { type: "HIGH_FIVE" }>, context: EffectContext, random: RandomSource, events: UnoExpandedEvents): void {
  requireEffect(game, command.effectId); const effect = game.effect;
  requireExpanded(effect?.kind === "high-five" && game.phase === "high-five", "INVALID_PHASE");
  requireExpanded(effect.attempt === command.attempt, "STALE_EFFECT");
  requireExpanded(effect.eligiblePlayerIds.includes(actorId), "NOT_YOUR_TURN");
  requireExpanded(!effect.responseOrder.includes(actorId), "ALREADY_RESPONDED");
  requireExpanded(effect.opensAt !== null && effect.deadline !== null && context.now >= effect.opensAt, "EFFECT_NOT_OPEN");
  requireExpanded(context.now < effect.deadline, "EFFECT_EXPIRED");
  effect.stage = "active"; effect.responseOrder.push(actorId);
  events.public.push({ type: "HIGH_FIVE_RESPONSE", effectId: effect.id, attempt: effect.attempt, playerId: actorId, rank: effect.responseOrder.length });
  if (effect.responseOrder.length === effect.eligiblePlayerIds.length) finishHighFive(game, random, events);
}

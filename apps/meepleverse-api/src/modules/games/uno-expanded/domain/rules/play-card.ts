import type { EffectContext } from "../models/effect-context.js";
import { startUp } from "./wild-up.js";
import { startBattle } from "./wild-battle.js";
import { startHighFive } from "./high-five.js";
import type { UnoExpandedCommand } from "@meepleverse/contracts/uno-expanded";
import { getNextPlayer, type RandomSource } from "../../../uno-common/index.js";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import type { UnoExpandedEvents } from "../events/uno-expanded-events.js";
import { requireExpanded } from "../errors/uno-expanded.errors.js";
import { fixedDrawAmount, isSupportedCard } from "../constants/supported-cards.js";
import { canPlayExpandedCard } from "./can-play-card.js";
import { prepareHandChange } from "./prepare-hand-change.js";
import { applyHandChange } from "./apply-hand-change.js";
import { passExpandedHands } from "./pass-hands.js";
import { resolveExpandedUno } from "./resolve-uno.js";
import { acceptExpandedDrawPenalty } from "./accept-draw-penalty.js";
import { resolveExpandedDrawEffect } from "./resolve-draw-effect.js";
import { endExpandedGame } from "./scoring.js";
export function playExpandedCard(game: UnoExpandedGame, actorId: string, command: Extract<UnoExpandedCommand, { type: "PLAY_CARD" }>, random: RandomSource, events: UnoExpandedEvents, context: EffectContext): void {
  const actor = game.players[game.currentIndex]!;
  const index = actor.hand.findIndex(card => card.id === command.cardId);
  requireExpanded(index !== -1, "CARD_NOT_OWNED");
  const card = actor.hand[index]!;
  requireExpanded(isSupportedCard(card), "UNSUPPORTED_COMMAND");
  requireExpanded(game.phase !== "drawn" || game.drawnCardId === card.id, "DRAWN_CARD_ONLY");
  requireExpanded(canPlayExpandedCard(game, card), "CARD_NOT_PLAYABLE");
  requireExpanded(card.color === null ? command.chosenColor !== undefined : command.chosenColor === undefined, "INVALID_COLOR");
  let target = getNextPlayer(game.currentIndex, game.players.length, game.direction);
  if (card.kind === "wild-target-four" || (card.kind === "wild-battle" && (actor.hand.length > 1 || command.targetPlayerId !== undefined))) {
    target = game.players.findIndex(player => player.id === command.targetPlayerId && player.id !== actorId);
    requireExpanded(target !== -1, "INVALID_TARGET");
  } else requireExpanded(command.targetPlayerId === undefined, "INVALID_TARGET");
  const handChange = prepareHandChange(actor, card, command);
  actor.hand.splice(index, 1); game.discardPile.push(card);
  game.activeColor = card.color ?? command.chosenColor!;
  game.drawnCardId = null; game.blockedTurns = 0;
  events.public.push({ type: "CARD_PLAYED", playerId: actorId, card: structuredClone(card) });
  if (card.color === null) events.public.push({ type: "COLOR_CHOSEN", playerId: actorId, color: game.activeColor });
  applyHandChange(game, actorId, handChange, events);
  if (card.kind === "seven-change-left" || card.kind === "seven-change-right") {
    // A final non-draw card wins before its remaining transfer effect; never pass an empty hand to win for someone else.
    if (actor.hand.length === 0) { endExpandedGame(game, actorId, events); return; }
    passExpandedHands(game, actorId, card.kind === "seven-change-left" ? 1 : -1, events);
    // Penalize the actual actor after transfers, so the penalty cannot be handed to an innocent recipient.
    resolveExpandedUno(game, actorId, handChange.requiresUno, command.declareUno === true, random, events);
    game.phase = "turn";
    game.currentIndex = getNextPlayer(game.currentIndex, game.players.length, game.direction);
    return;
  }
  resolveExpandedUno(game, actorId, handChange.requiresUno, command.declareUno === true, random, events);
  if (card.kind === "wild-up" || card.kind === "wild-battle" || card.kind === "high-five") {
    if (actor.hand.length === 0) { endExpandedGame(game, actorId, events); return; }
    if (card.kind === "wild-up") startUp(game, actorId, random, events);
    else if (card.kind === "wild-battle") startBattle(game, actorId, target, context, random, events);
    else startHighFive(game, actorId, context, events);
    return;
  }
  const amount = fixedDrawAmount(card);
  if (amount > 0 || (card.kind === "wild-shield" && game.pendingDraw > 0)) {
    game.pendingDraw += amount; game.currentIndex = target; game.phase = "draw-stack";
    events.public.push({ type: "PENALTY_UPDATED", playerId: game.players[target]!.id, count: game.pendingDraw });
    // Last-card wins settle the mandatory debt, matching the established final-penalty policy.
    if (actor.hand.length === 0) {
      acceptExpandedDrawPenalty(game, game.players[target]!.id, random, events);
      endExpandedGame(game, actorId, events);
    }
    return;
  }
  game.phase = "turn";
  const forcedDraw = resolveExpandedDrawEffect(game, card, actorId, target, random, events);
  let steps = card.kind === "skip-two" ? 3 : forcedDraw || card.kind === "skip" ? 2 : 1;
  if (card.kind === "reverse") {
    game.direction = game.direction === 1 ? -1 : 1;
    if (game.players.length === 2) steps = 2;
  }
  game.currentIndex = getNextPlayer(game.currentIndex, game.players.length, game.direction, steps);
  if (actor.hand.length === 0) endExpandedGame(game, actorId, events);
}

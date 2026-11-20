import { effectContext, type EffectOptions } from "../models/effect-context.js";
import { answerUp } from "./wild-up.js";
import { answerBattle, answerBattleReward } from "./wild-battle.js";
import { answerHighFive } from "./high-five.js";
import { unoExpandedCommandSchema } from "@meepleverse/contracts/uno-expanded";
import { getNextPlayer, type RandomSource } from "../../../uno-common/index.js";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import type { UnoExpandedEvents } from "../events/uno-expanded-events.js";
import { requireExpanded } from "../errors/uno-expanded.errors.js";
import { playExpandedCard } from "./play-card.js";
import { drawExpandedCards } from "./draw-cards.js";
import { canPlayExpandedCard } from "./can-play-card.js";
import { acceptExpandedDrawPenalty } from "./accept-draw-penalty.js";
import { endExpandedGame } from "./scoring.js";
export interface ExpandedTransition { state: UnoExpandedGame; events: UnoExpandedEvents }
/** Rejected commands never mutate the caller's state; accepted actions increment revision exactly once. */
export function applyExpandedCommand(input: UnoExpandedGame, actorId: string, payload: unknown, random: RandomSource = Math.random, options: EffectOptions = {}): ExpandedTransition {
  const parsed = unoExpandedCommandSchema.safeParse(payload);
  requireExpanded(parsed.success, "INVALID_COMMAND");
  requireExpanded(input.players.some(player => player.id === actorId), "UNKNOWN_PLAYER");
  requireExpanded(input.phase !== "ended", "GAME_ENDED");
  const game = structuredClone(input); const events: UnoExpandedEvents = { public: [] };
  const command = parsed.data; const context = effectContext(options);
  if (command.type === "UP_PLAY") answerUp(game, actorId, command, random, events);
  else if (command.type === "BATTLE_SELECT") answerBattle(game, actorId, command, context, random, events);
  else if (command.type === "BATTLE_DISCARD") answerBattleReward(game, actorId, command, context, random, events);
  else if (command.type === "HIGH_FIVE") answerHighFive(game, actorId, command, context, random, events);
  else {
    requireExpanded(["turn", "drawn", "draw-stack"].includes(game.phase), "INVALID_PHASE");
    requireExpanded(game.players[game.currentIndex]!.id === actorId, "NOT_YOUR_TURN");
    switch (command.type) {
    case "PLAY_CARD": playExpandedCard(game, actorId, command, random, events, context); break;
    case "ACCEPT_DRAW_PENALTY": acceptExpandedDrawPenalty(game, actorId, random, events); break;
    case "PASS_TURN":
      requireExpanded(game.phase === "drawn", "INVALID_PHASE");
      game.drawnCardId = null; game.phase = "turn";
      game.currentIndex = getNextPlayer(game.currentIndex, game.players.length, game.direction); break;
    case "CHOOSE_COLOR": requireExpanded(false, "INVALID_PHASE"); break;
    case "DRAW_CARD": {
      requireExpanded(game.phase === "turn", "INVALID_PHASE");
      const [card] = drawExpandedCards(game, actorId, 1, random, events, "draw");
      game.blockedTurns = card ? 0 : game.blockedTurns + 1;
      if (card && canPlayExpandedCard(game, card)) { game.drawnCardId = card.id; game.phase = "drawn"; }
      else {
        game.currentIndex = getNextPlayer(game.currentIndex, game.players.length, game.direction);
        const anyPlayable = game.players.some(player => player.hand.some(card => canPlayExpandedCard(game, card)));
        if (game.blockedTurns >= game.players.length && !anyPlayable) endExpandedGame(game, null, events);
      }
      break;
    }
  }
  }
  game.revision++;
  if (!["ended", "high-five", "battle-select"].includes(game.phase)) events.public.push({ type: "TURN_CHANGED", playerId: game.players[game.currentIndex]!.id, phase: game.phase });
  return { state: game, events };
}

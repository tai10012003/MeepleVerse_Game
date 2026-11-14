import { unoCommandSchema } from "@meepleverse/contracts/uno";
import type { UnoGame } from "../models/uno-game.js";
import type { UnoEvents } from "../events/uno-event.js";
import { requireRule } from "../errors/uno.errors.js";
import { playCard } from "./play-card.js";
import { drawCards } from "./draw-cards.js";
import { canPlayCard } from "./can-play-card.js";
import { getNextPlayer } from "./get-next-player.js";
import { acceptDrawPenalty } from "./accept-draw-penalty.js";
import { endGame } from "./scoring.js";
import type { RandomSource } from "./shuffle.js";
export interface Transition { state: UnoGame; events: UnoEvents }
// Clone before executing: accepted commands return a new state; errors leave the input untouched.
export function applyCommand(input: UnoGame, actorId: string, payload: unknown, random: RandomSource = Math.random): Transition {
  const parsed = unoCommandSchema.safeParse(payload);
  requireRule(parsed.success, "INVALID_COMMAND");
  requireRule(input.players.some(player => player.id === actorId), "UNKNOWN_PLAYER");
  requireRule(input.phase !== "ended", "GAME_ENDED");
  const game = structuredClone(input);
  const events: UnoEvents = { public: [] };
  const command = parsed.data;
  requireRule(game.players[game.currentIndex]!.id === actorId, "NOT_YOUR_TURN");
  switch (command.type) {
    case "PLAY_CARD": playCard(game, actorId, command, random, events); break;
    case "CHOOSE_COLOR":
      requireRule(game.phase === "choose-color" || game.phase === "penalty-color", "INVALID_PHASE");
      // After the final +4 author picks a color, skip the recipient who already drew.
      if (game.phase === "penalty-color") game.currentIndex = getNextPlayer(game.currentIndex, game.players.length, game.direction, 2);
      game.activeColor = command.color;
      events.public.push({ type: "COLOR_CHOSEN", playerId: actorId, color: command.color });
      game.phase = "turn";
      break;
    case "ACCEPT_DRAW_PENALTY":
      acceptDrawPenalty(game, actorId, random, events);
      break;
    case "PASS_TURN":
      requireRule(game.phase === "drawn", "INVALID_PHASE");
      game.drawnCardId = null;
      game.phase = "turn";
      game.currentIndex = getNextPlayer(game.currentIndex, game.players.length, game.direction);
      break;
    case "DRAW_CARD": {
      requireRule(game.phase === "turn", "INVALID_PHASE");
      const [card] = drawCards(game, actorId, 1, random, events);
      game.blockedTurns = card ? 0 : game.blockedTurns + 1;
      if (card && canPlayCard(card, game.discardPile.at(-1)!, game.activeColor!)) {
        game.drawnCardId = card.id;
        game.phase = "drawn";
      } else {
        game.currentIndex = getNextPlayer(game.currentIndex, game.players.length, game.direction);
        if (game.blockedTurns >= game.players.length) endGame(game, null, events);
      }
      break;
    }
  }
  game.revision++;
  return { state: game, events };
}

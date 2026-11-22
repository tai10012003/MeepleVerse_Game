import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import { applyExpandedCommand, type ExpandedTransition } from "./apply-command.js";
import { canAnswerUp } from "./wild-up.js";
import { getNextPlayer } from "../../../uno-common/index.js";
import type { EffectOptions } from "../models/effect-context.js";
export function timeoutExpandedTurn(input: UnoExpandedGame, options: EffectOptions = {}): ExpandedTransition {
  const actor = input.players[input.currentIndex]!;
  if (input.effect?.kind === "up") {
    const card = actor.hand.find(card => canAnswerUp(input, card));
    if (!card) throw new Error("Up turn must have an eligible reply");
    return applyExpandedCommand(input, actor.id, { type: "UP_PLAY", effectId: input.effect.id, cardId: card.id }, Math.random, options);
  }
  if (input.phase === "draw-stack") return applyExpandedCommand(input, actor.id, { type: "ACCEPT_DRAW_PENALTY" }, Math.random, options);
  if (input.phase === "drawn") return applyExpandedCommand(input, actor.id, { type: "PASS_TURN" }, Math.random, options);
  if (input.phase !== "turn") throw new Error("No timed Expanded turn");
  const state = structuredClone(input);
  state.currentIndex = getNextPlayer(state.currentIndex, state.players.length, state.direction);
  state.drawnCardId = null; state.revision++;
  return { state, events: { public: [{ type: "TURN_CHANGED", playerId: state.players[state.currentIndex]!.id, phase: state.phase }] } };
}

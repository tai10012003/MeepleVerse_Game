import type { UnoGame } from "../models/uno-game.js";
import type { Transition } from "./apply-command.js";
import { applyCommand } from "./apply-command.js";
import { getNextPlayer } from "./get-next-player.js";
/** Server-only action: ordinary PASS_TURN remains forbidden in the client command protocol. */
export function timeoutUnoTurn(input: UnoGame): Transition {
  const actor = input.players[input.currentIndex]!;
  if (input.phase === "draw-stack") return applyCommand(input, actor.id, { type: "ACCEPT_DRAW_PENALTY" });
  if (input.phase === "drawn") return applyCommand(input, actor.id, { type: "PASS_TURN" });
  if (input.phase === "penalty-color" || input.phase === "choose-color") {
    const colors = ["red", "yellow", "green", "blue"] as const;
    const color = colors.reduce((best, next) => actor.hand.filter(card => card.color === next).length > actor.hand.filter(card => card.color === best).length ? next : best, "red");
    return applyCommand(input, actor.id, { type: "CHOOSE_COLOR", color });
  }
  if (input.phase !== "turn") throw new Error("No timed UNO turn");
  const state = structuredClone(input);
  state.currentIndex = getNextPlayer(state.currentIndex, state.players.length, state.direction);
  state.drawnCardId = null; state.revision++;
  return { state, events: { public: [] } };
}

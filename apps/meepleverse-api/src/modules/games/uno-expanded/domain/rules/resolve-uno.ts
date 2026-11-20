import type { RandomSource } from "../../../uno-common/index.js";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import type { UnoExpandedEvents } from "../events/uno-expanded-events.js";
import { drawExpandedCards } from "./draw-cards.js";
/** requiresUno describes the active discard, not cards subsequently received through a transfer. */
export function resolveExpandedUno(game: UnoExpandedGame, actorId: string, requiresUno: boolean,
  declared: boolean, random: RandomSource, events: UnoExpandedEvents): void {
  if (!requiresUno) return;
  if (declared) events.public.push({ type: "UNO_CALLED", playerId: actorId });
  else {
    events.public.push({ type: "UNO_PENALTY", playerId: actorId });
    drawExpandedCards(game, actorId, 2, random, events, "uno");
  }
}

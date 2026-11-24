import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import type { UnoExpandedEvents } from "../events/uno-expanded-events.js";
/** Exchange only the two private hands. Never publish transferred card IDs or faces. */
export function swapExpandedHands(game: UnoExpandedGame, actorId: string, targetIndex: number, events: UnoExpandedEvents): void {
  const actor = game.players[game.currentIndex]!;
  const target = game.players[targetIndex]!;
  [actor.hand, target.hand] = [target.hand, actor.hand];
  events.public.push({ type: "HANDS_SWAPPED", playerId: actorId, targetPlayerId: target.id,
    playerHandCount: actor.hand.length, targetHandCount: target.hand.length });
}

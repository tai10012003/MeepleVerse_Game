import { getNextPlayer } from "../../../uno-common/index.js";
import type { UnoDirection } from "@meepleverse/contracts/uno-common";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import type { UnoExpandedEvents } from "../events/uno-expanded-events.js";
/** Transfer by fixed seat order, independently of the direction before the card was played. */
export function passExpandedHands(game: UnoExpandedGame, actorId: string, direction: UnoDirection, events: UnoExpandedEvents): void {
  const hands = game.players.map(player => player.hand);
  const transfers = game.players.map((from, index) => {
    const target = getNextPlayer(index, game.players.length, direction);
    game.players[target]!.hand = hands[index]!;
    return { fromPlayerId: from.id, toPlayerId: game.players[target]!.id, count: hands[index]!.length };
  });
  game.direction = direction;
  events.public.push({ type: "HANDS_PASSED", playerId: actorId, direction, transfers });
}

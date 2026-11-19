import type { UnoExpandedCommand } from "@meepleverse/contracts/uno-expanded";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import { requireExpanded, UnoExpandedRuleError } from "../errors/uno-expanded.errors.js";
/** No Basic fallback: every gameplay command stays unavailable until its rules are implemented. */
export function applyExpandedCommand(game: UnoExpandedGame, playerId: string, command: UnoExpandedCommand): never {
  requireExpanded(game.players.some(player => player.id === playerId), "UNKNOWN_PLAYER");
  void command;
  throw new UnoExpandedRuleError("UNSUPPORTED_COMMAND");
}

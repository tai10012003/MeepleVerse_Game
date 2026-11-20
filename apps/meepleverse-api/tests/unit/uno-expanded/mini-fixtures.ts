import type { UnoExpandedCommand } from "@meepleverse/contracts/uno-expanded";
import { applyExpandedCommand, advanceExpandedEffects, type UnoExpandedGame } from "../../../src/modules/games/uno-expanded/index.js";
import { seeded } from "../uno/fixtures.js";
export function act(game: UnoExpandedGame, actor: string, command: UnoExpandedCommand, now = 0) {
  return applyExpandedCommand(game, actor, command, seeded(31), { now });
}
export function tick(game: UnoExpandedGame, now: number) { return advanceExpandedEffects(game, { now }, seeded(32)); }
export function effectId(game: UnoExpandedGame) { if (!game.effect) throw new Error("Missing effect"); return game.effect.id; }

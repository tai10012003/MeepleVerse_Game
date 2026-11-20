import { describe, expect, it } from "vitest";
import type { UnoExpandedCommand } from "@meepleverse/contracts/uno-expanded";
import { createExpandedGame, applyExpandedCommand, getExpandedPlayerView } from "../../../src/modules/games/uno-expanded/index.js";
import { seeded } from "../uno/fixtures.js";
import { conserved } from "./fixtures.js";
describe("Expanded partial-rule simulation", () => {
  it.each([2, 3, 4])("conserves all 198 cards across 20 seeded %i-player runs (up to 500 commands each)", count => {
    for (let seed = 1; seed <= 20; seed++) {
      const random = seeded(seed); let game = createExpandedGame(Array.from({ length: count }, (_, i) => "p" + i), random);
      for (let step = 0; step < 500 && game.phase !== "ended"; step++) {
        const actor = game.players[game.currentIndex]!; const view = getExpandedPlayerView(game, actor.id);
        const card = actor.hand.find(card => card.id === view.self.playableCardIds[Math.floor(random() * view.self.playableCardIds.length)]);
        let command: UnoExpandedCommand;
        if (card) command = { type: "PLAY_CARD", cardId: card.id, declareUno: actor.hand.length === 2,
          ...(card.color === null ? { chosenColor: "blue" as const } : {}),
          ...(card.kind === "wild-target-four" ? { targetPlayerId: game.players[(game.currentIndex + 1) % count]!.id } : {}) };
        else command = { type: game.phase === "draw-stack" ? "ACCEPT_DRAW_PENALTY" : game.phase === "drawn" ? "PASS_TURN" : "DRAW_CARD" };
        const previous = game; const transition = applyExpandedCommand(game, actor.id, command, random); game = transition.state;
        expect(game.revision).toBe(previous.revision + 1); conserved(previous, game);
        expect(game.pendingDraw).toBeGreaterThanOrEqual(0);
        expect(game.phase === "draw-stack").toBe(game.pendingDraw > 0);
        expect(game.phase === "drawn").toBe(game.drawnCardId !== null);
        for (const observer of game.players.filter(player => player.id !== game.players[game.currentIndex]!.id)) {
          expect(getExpandedPlayerView(game, observer.id).self.playableCardIds).toEqual([]);
        }
      }
    }
  }, 30000);
});

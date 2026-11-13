import { expect, it } from "vitest";
import type { UnoCommand } from "@meepleverse/contracts/uno";
import { applyCommand, createGame } from "../../../src/modules/games/uno/index.js";
import { canPlayCard } from "../../../src/modules/games/uno/domain/rules/can-play-card.js";
import { seeded } from "./fixtures.js";
it("completes 100 seeded games, preserving every physical card after each action", () => {
  for (let seed = 1; seed <= 100; seed++) {
    const random = seeded(seed);
    const count = 2 + seed % 3;
    let game = createGame(Array.from({ length: count }, (_, i) => "p" + i), random);
    let steps = 0;
    while (game.phase !== "ended" && steps++ < 5000) {
      const player = game.players[game.currentIndex]!;
      let command: UnoCommand;
      if (game.phase === "choose-color") command = { type: "CHOOSE_COLOR", color: "red" };
      else if (game.phase === "draw-four") command = { type: seed % 2 ? "CHALLENGE_DRAW_FOUR" : "ACCEPT_DRAW_FOUR" };
      else {
        const card = player.hand.find(card =>
          (game.phase !== "drawn" || card.id === game.drawnCardId) &&
          canPlayCard(card, game.discardPile.at(-1)!, game.activeColor!));
        command = card ? { type: "PLAY_CARD", cardId: card.id,
          ...(card.color === null ? { chosenColor: "red" as const } : {}),
          declareUno: player.hand.length === 2,
        } : { type: game.phase === "drawn" ? "PASS_TURN" : "DRAW_CARD" };
      }
      game = applyCommand(game, player.id, command, random).state;
      const cards = [...game.drawPile, ...game.discardPile, ...game.players.flatMap(p => p.hand)];
      expect(cards).toHaveLength(108);
      expect(new Set(cards.map(card => card.id)).size).toBe(108);
      expect(game.currentIndex).toBeGreaterThanOrEqual(0);
      expect(game.currentIndex).toBeLessThan(count);
    }
    expect(game.phase, "seed " + seed).toBe("ended");
    expect(game.result).not.toBeNull();
  }
}, 30000);

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
      if (game.phase === "choose-color" || game.phase === "penalty-color") command = { type: "CHOOSE_COLOR", color: "red" };
      else {
        const card = player.hand.find(card =>
          (game.phase !== "drawn" || card.id === game.drawnCardId) &&
          (game.phase === "draw-stack" ? card.kind === "draw-two" || card.kind === "wild-draw-four" : canPlayCard(card, game.discardPile.at(-1)!, game.activeColor!)));
        command = card ? { type: "PLAY_CARD", cardId: card.id,
          ...(card.kind === "wild" ? { chosenColor: "red" as const } : {}),
          declareUno: player.hand.length === 2,
        } : { type: game.phase === "draw-stack" ? "ACCEPT_DRAW_PENALTY" : game.phase === "drawn" ? "PASS_TURN" : "DRAW_CARD" };
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

it("completes 200 four-player games with varied colors, voluntary draws, passes and missed UNO calls", () => {
  const coverage = new Set<string>();
  let penalties = 0;
  for (let seed = 1; seed <= 200; seed++) {
    const random = seeded(seed + 1000);
    let game = createGame(["p0", "p1", "p2", "p3"], random);
    let steps = 0;
    while (game.phase !== "ended" && steps++ < 6000) {
      const player = game.players[game.currentIndex]!;
      let command: UnoCommand;
      if (game.phase === "choose-color" || game.phase === "penalty-color") command = { type: "CHOOSE_COLOR", color: (["red", "yellow", "green", "blue"] as const)[Math.floor(random() * 4)]! };
      else {
        const legal = player.hand.filter(card => (game.phase !== "drawn" || card.id === game.drawnCardId) && (game.phase === "draw-stack" ? card.kind === "draw-two" || card.kind === "wild-draw-four" : canPlayCard(card, game.discardPile.at(-1)!, game.activeColor!)));
        const card = legal[Math.floor(random() * legal.length)];
        const decline = game.phase === "turn" ? random() < .04 : game.phase === "drawn" ? random() < .1 : false;
        if (card && !decline) {
          coverage.add(card.kind);
          command = { type: "PLAY_CARD", cardId: card.id, ...(card.kind === "wild" ? { chosenColor: (["red", "yellow", "green", "blue"] as const)[Math.floor(random() * 4)]! } : {}), declareUno: player.hand.length === 2 && random() > .2 };
        } else command = { type: game.phase === "draw-stack" ? "ACCEPT_DRAW_PENALTY" : game.phase === "drawn" ? "PASS_TURN" : "DRAW_CARD" };
      }
      coverage.add(command.type);
      const transition = applyCommand(game, player.id, command, random);
      penalties += transition.events.public.filter(event => event.type === "UNO_PENALTY").length;
      game = transition.state;
      const cards = [...game.drawPile, ...game.discardPile, ...game.players.flatMap(player => player.hand)];
      expect(cards).toHaveLength(108); expect(new Set(cards.map(card => card.id)).size).toBe(108);
      expect(game.currentIndex).toBeGreaterThanOrEqual(0); expect(game.currentIndex).toBeLessThan(4);
      expect(game.pendingDraw).toBeGreaterThanOrEqual(0);
    }
    expect(game.phase, "four-player seed " + seed).toBe("ended");
    if (game.result!.winnerId) expect(game.players.find(player => player.id === game.result!.winnerId)!.hand).toHaveLength(0);
  }
  for (const branch of ["number", "skip", "reverse", "draw-two", "wild", "wild-draw-four", "DRAW_CARD", "PASS_TURN", "CHOOSE_COLOR", "ACCEPT_DRAW_PENALTY"]) expect(coverage.has(branch), branch).toBe(true);
  expect(penalties).toBeGreaterThan(0);
}, 60000);

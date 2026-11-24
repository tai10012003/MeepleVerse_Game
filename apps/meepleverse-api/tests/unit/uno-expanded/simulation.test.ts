import { describe, expect, it } from "vitest";
import type { UnoExpandedCommand } from "@meepleverse/contracts/uno-expanded";
import { createExpandedGame, applyExpandedCommand, advanceExpandedEffects, getExpandedPlayerView } from "../../../src/modules/games/uno-expanded/index.js";
import { seeded } from "../uno/fixtures.js";
import { conserved } from "./fixtures.js";
describe("Expanded complete-rule simulation", () => {
  it.each([2, 3, 4])("finishes 20 seeded %i-player games with all mini-games and conserves 202 cards after each transition", count => {
    for (let seed = 1; seed <= 20; seed++) {
      const random = seeded(seed); let now = 0;
      let game = createExpandedGame(Array.from({ length: count }, (_, i) => "p" + i), random);
      for (let step = 0; step < 2000 && game.phase !== "ended"; step++) {
        const previous = game; now += 10;
        let actor = game.players[game.currentIndex]!;
        let command: UnoExpandedCommand;
        const effect = game.effect;
        if (effect?.kind === "high-five") {
          if (effect.stage === "preparing") {
            now = Math.max(now, effect.opensAt!);
            game = advanceExpandedEffects(game, { now }, random)!.state;
            conserved(previous, game); expect(game.revision).toBe(previous.revision + 1); continue;
          }
          actor = game.players.find(player => effect.eligiblePlayerIds.includes(player.id) && !effect.responseOrder.includes(player.id))!;
          command = { type: "HIGH_FIVE", effectId: effect.id, attempt: effect.attempt };
        } else if (effect?.kind === "battle" && effect.stage === "select") {
          actor = game.players.find(player => (getExpandedPlayerView(game, player.id).self.battle?.eligibleCardIds.length ?? 0) > 0)!;
          command = { type: "BATTLE_SELECT", effectId: effect.id, cardId: getExpandedPlayerView(game, actor.id).self.battle!.eligibleCardIds[0]!, declareUno: actor.hand.length === 2 };
        } else if (effect?.kind === "battle" && effect.stage === "reward") {
          actor = game.players.find(player => player.id === effect.winnerId)!;
          command = { type: "BATTLE_DISCARD", effectId: effect.id, cardIds: actor.hand.slice(0, effect.rewardCount).map(card => card.id), declareUno: actor.hand.length - effect.rewardCount === 1 };
        } else {
          const view = getExpandedPlayerView(game, actor.id);
          const selectedId = view.self.playableCardIds[Math.floor(random() * view.self.playableCardIds.length)];
          const card = actor.hand.find(card => card.id === selectedId);
          if (effect?.kind === "up") {
            expect(card).toBeDefined();
            command = { type: "UP_PLAY", effectId: effect.id, cardId: card!.id, declareUno: actor.hand.length === 2 };
          } else if (card) {
            const remaining = actor.hand.filter(held => held.id !== card.id);
            const chosenColor = (["red", "yellow", "green", "blue"] as const).reduce((best, color) =>
              remaining.filter(held => held.color === color).length > remaining.filter(held => held.color === best).length ? color : best, "blue");
            const selected = card.kind === "wild-divide-two" ? remaining.slice(0, Math.floor(remaining.length / 2)) : [];
            const discarded = card.kind === "discard-color" || card.kind === "wild-discard" ? remaining.filter(held => held.color === (card.color ?? chosenColor)).length : selected.length;
            command = { type: "PLAY_CARD", cardId: card.id, declareUno: card.kind !== "wild-card-swap" && remaining.length - discarded === 1,
              ...(card.color === null ? { chosenColor } : {}),
              ...(card.kind === "wild-divide-two" ? { discardCardIds: selected.map(card => card.id) } : {}),
              ...(card.kind === "wild-target-four" || card.kind === "wild-battle" || card.kind === "wild-card-swap" ? { targetPlayerId: game.players[(game.currentIndex + 1) % count]!.id } : {}) };
          } else command = { type: game.phase === "draw-stack" ? "ACCEPT_DRAW_PENALTY" : game.phase === "drawn" ? "PASS_TURN" : "DRAW_CARD" };
        }
        game = applyExpandedCommand(game, actor.id, command, random, { now }).state;
        expect(game.revision).toBe(previous.revision + 1); conserved(previous, game);
        expect(game.phase === "draw-stack").toBe(game.pendingDraw > 0); expect(game.phase === "drawn").toBe(game.drawnCardId !== null);
        expect(["up", "battle-select", "battle-discard", "high-five"].includes(game.phase)).toBe(game.effect !== null);
      }
      expect(game.phase, "seed " + seed).toBe("ended"); expect(game.result).not.toBeNull(); expect(game.effect).toBeNull();
    }
  }, 60000);
});

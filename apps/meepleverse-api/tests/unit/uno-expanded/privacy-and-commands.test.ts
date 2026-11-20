import { describe, expect, it } from "vitest";
import { unoExpandedRoomActionSchema } from "@meepleverse/contracts/uno-expanded";
import { createExpandedGame, getExpandedPlayerView } from "../../../src/modules/games/uno-expanded/index.js";
import { applyExpandedCommand } from "../../../src/modules/games/uno-expanded/domain/rules/apply-command.js";
import { seeded } from "../uno/fixtures.js";
describe("Expanded view and command boundary", () => {
  it("reveals only the caller's hand and never aliases domain state", () => {
    const game = createExpandedGame(["a", "b", "c", "d"], seeded(7));
    for (const player of game.players) {
      const view = getExpandedPlayerView(game, player.id);
      expect(view.self.hand).toEqual(player.hand); expect(view.currentPlayerId).toBe(game.players[game.currentIndex]!.id);
      expect(view.players.every(other => !('hand' in other))).toBe(true);
      for (const hidden of [...game.drawPile, ...game.players.filter(other => other !== player).flatMap(other => other.hand)]) {
        expect(JSON.stringify(view)).not.toContain('"' + hidden.id + '"');
      }
      view.self.hand.length = 0; if (view.topCard.kind === "number") view.topCard.value = 99;
      expect(player.hand).toHaveLength(7); expect(game.discardPile[0]).not.toEqual(view.topCard);
    }
    expect(() => getExpandedPlayerView(game, "outsider")).toThrow("UNKNOWN_PLAYER");
  });
  it("rejects a separately chosen color without mutating the turn", () => {
    const game = createExpandedGame(["a", "b"], seeded(17)); const before = structuredClone(game);
    expect(() => applyExpandedCommand(game, game.players[game.currentIndex]!.id, { type: "CHOOSE_COLOR", color: "red" })).toThrow("INVALID_PHASE");
    expect(game).toEqual(before);
  });
  it("validates envelopes strictly instead of accepting arbitrary future actions or client settings", () => {
    const valid = { requestId: "a", action: { type: "START_GAME", expectedRoomRevision: 1 } };
    expect(unoExpandedRoomActionSchema.safeParse(valid).success).toBe(true);
    for (const payload of [{ ...valid, enableExpandedRooms: true }, { ...valid, action: { ...valid.action, gameId: "uno-basic" } },
      { requestId: "x", action: { type: "GAME_COMMAND", matchId: "m", expectedRevision: 0, command: { type: "HIGH_FIVE" } } }]) {
      expect(unoExpandedRoomActionSchema.safeParse(payload).success).toBe(false);
    }
  });
});

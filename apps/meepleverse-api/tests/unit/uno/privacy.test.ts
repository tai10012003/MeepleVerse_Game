import { describe, expect, it } from "vitest";
import { getPlayerView, applyCommand } from "../../../src/modules/games/uno/index.js";
import { fixture, number, wild } from "./fixtures.js";
describe("player views", () => {
  it("shares only the recent public discards and follows recycling", () => {
    const game = fixture([[number("mine")], [number("opponent")]]);
    game.discardPile = Array.from({ length: 12 }, (_, i) => number("discard-" + i));
    const view = getPlayerView(game, "p0");
    expect(view.discardCards.map(card => card.id)).toEqual(game.discardPile.slice(-8).map(card => card.id));
    view.discardCards[0]!.id = "mutated";
    expect(game.discardPile[4]!.id).toBe("discard-4");
    game.discardPile = [game.discardPile.at(-1)!];
    expect(getPlayerView(game, "p0").discardCards.map(card => card.id)).toEqual(["discard-11"]);
  });
  it("exposes only one's hand and public counts; output mutations cannot change the game", () => {
    const game = fixture([[number("my-card")], [number("secret-opponent")]], [number("secret-stock")]);
    const view = getPlayerView(game, "p0");
    expect(view.self.hand[0]!.id).toBe("my-card");
    expect(view.players[1]).toEqual({ playerId: "p1", handCount: 1 });
    expect(JSON.stringify(view)).not.toMatch(/secret-opponent|secret-stock/);
    view.self.hand.length = 0;
    view.topCard.id = "changed";
    expect(game.players[0]!.hand).toHaveLength(1);
    expect(game.discardPile[0]!.id).toBe("top");
    expect(() => getPlayerView(game, "outsider")).toThrow("UNKNOWN_PLAYER");
  });
  it("never includes challenge evidence in public events", () => {
    const game = fixture([[wild("w", "wild-draw-four"), number("secret")], [number("other")]]);
    const pending = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "w", chosenColor: "blue" }).state;
    const next = applyCommand(pending, "p1", { type: "CHALLENGE_DRAW_FOUR" });
    expect(JSON.stringify(next.events.public)).not.toContain("secret");
    expect(next.events.private[0]?.cards.some(card => card.id === "secret")).toBe(true);
    next.events.private[0]!.cards.length = 0;
    expect(pending.pendingDrawFour!.handBefore).toHaveLength(2);
  });
});

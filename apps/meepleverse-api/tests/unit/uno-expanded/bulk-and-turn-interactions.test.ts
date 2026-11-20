import { describe, expect, it } from "vitest";
import type { UnoExpandedCard } from "@meepleverse/contracts/uno-expanded";
import { applyExpandedCommand, getExpandedPlayerView } from "../../../src/modules/games/uno-expanded/index.js";
import { fixture, num, colored, black, left, right, stock, play, step, conserved } from "./fixtures.js";
describe("Expanded bulk moves and turn interactions", () => {
  for (const count of [2, 3, 4]) it.each([1, -1] as const)(`Skip Two skips two opportunities with ${count} seats in direction %i`, direction => {
    const game = fixture([[colored("skip", "skip-two"), num("keep-a"), num("keep-b")], ...Array.from({ length: count - 1 }, (_, i) => [num("other-" + i)])], stock(5)); game.direction = direction;
    const next = play(game, "skip").state;
    expect(next.currentIndex).toBe(count === 2 ? 1 : count === 3 ? 0 : direction === 1 ? 3 : 1);
    expect(next.direction).toBe(direction); expect(next.players.every((player, i) => player.hand.length === game.players[i]!.hand.length - (i === 0 ? 1 : 0))).toBe(true);
    conserved(game, next);
  });
  it("matches printed seven in either direction, including ordinary seven on a transfer card", () => {
    const cross = fixture([[right("change"), num("keep")], [num("other")]], stock(4), num("top", "yellow", 7));
    expect(getExpandedPlayerView(cross, "p0").self.playableCardIds).toContain("change");
    expect(play(cross, "change", { declareUno: true }).state.direction).toBe(-1);
    const ordinary = fixture([[num("seven", "blue", 7), num("keep")], [num("other")]], stock(4), left("top"));
    expect(play(ordinary, "seven", { declareUno: true }).state.discardPile.at(-1)!.id).toBe("seven");
    const opposite = fixture([[left("change", "yellow"), num("keep")], [num("other")]], stock(4), right("top", "blue"));
    expect(play(opposite, "change", { declareUno: true }).state.direction).toBe(1);
    const wrong = fixture([[num("six", "blue", 6), num("keep")], [num("other")]], stock(4), left("top"));
    expect(() => play(wrong, "six", { declareUno: true })).toThrow("CARD_NOT_PLAYABLE");
  });
  it("allows a freshly drawn divide card to choose older side cards, while still forbidding an older activation", () => {
    const game = fixture([[num("a"), num("b"), num("c"), num("d")], [num("other")]], [black("new-divide", "wild-divide-two"), ...stock(4)]);
    const drawn = step(game, { type: "DRAW_CARD" }).state;
    expect(drawn.phase).toBe("drawn");
    const result = play(drawn, "new-divide", { chosenColor: "green", discardCardIds: ["a", "c"] });
    expect(result.state.players[0]!.hand.map(card => card.id)).toEqual(["b", "d"]); expect(result.state.drawnCardId).toBeNull(); conserved(game, result.state);
    expect(() => play(drawn, "a", { discardCardIds: [] })).toThrow("DRAWN_CARD_ONLY");
  });
  it("a freshly drawn color discard clears the pre-existing matching cards in the same action", () => {
    const game = fixture([[num("red-a"), num("red-b"), num("blue", "blue")], [num("other")]], [colored("new-discard", "discard-color"), ...stock(4)]);
    const drawn = step(game, { type: "DRAW_CARD" }).state;
    const result = play(drawn, "new-discard", { declareUno: true });
    expect(result.state.players[0]!.hand.map(card => card.id)).toEqual(["blue"]); expect(result.state.drawnCardId).toBeNull(); conserved(game, result.state);
  });
  it.each([black("bad", "wild-divide-two"), colored("bad", "discard-color"), black("bad", "wild-discard"), left("bad"), right("bad"), colored("bad", "skip-two")] satisfies UnoExpandedCard[])("never allows $kind to answer a draw stack", card => {
    const game = fixture([[card, num("keep")], [num("other")]], stock(5), black("top", "wild-draw-eight"));
    game.phase = "draw-stack"; game.pendingDraw = 8; const before = structuredClone(game);
    expect(getExpandedPlayerView(game, "p0").self.playableCardIds).not.toContain("bad");
    expect(() => play(game, "bad", { ...(card.color === null ? { chosenColor: "red" as const } : {}), ...(card.kind === "wild-divide-two" ? { discardCardIds: [] } : {}) })).toThrow("CARD_NOT_PLAYABLE");
    expect(game).toEqual(before);
  });
  it.each(["color", "transfer"] as const)("rolls back a complete %s move if the subsequent UNO penalty cannot shuffle", kind => {
    const game = kind === "color" ? fixture([[colored("activation", "discard-color"), num("red-a"), num("red-b"), num("keep", "blue")], [num("other")]])
      : fixture([[left("activation"), num("keep")], [num("other-a"), num("other-b")], [num("received")]]);
    if (kind === "transfer") game.discardPile.unshift(num("older-a"), num("older-b"));
    const before = structuredClone(game);
    expect(() => applyExpandedCommand(game, "p0", { type: "PLAY_CARD", cardId: "activation" }, () => 1)).toThrow("INVALID_RANDOM");
    expect(game).toEqual(before);
  });
  it("keeps transfer payloads strict after enabling mini-games", () => {
    const game = fixture([[left("change"), black("future", "wild-up"), num("keep")], [num("other")]], stock(4));
    expect(getExpandedPlayerView(game, "p0").self.playableCardIds).toContain("future");
    expect(() => play(game, "future")).toThrow("INVALID_COLOR");
    expect(() => play(game, "change", { discardCardIds: [] })).toThrow("INVALID_SELECTION");
    expect(() => play(game, "change", { targetPlayerId: "p1" })).toThrow("INVALID_TARGET");
  });
});

import { describe, expect, it } from "vitest";
import { getExpandedPlayerView } from "../../../src/modules/games/uno-expanded/index.js";
import { fixture, num, colored, black, left, right, stock, play, conserved } from "./fixtures.js";
const mappings = [
  { count: 2, l: [1, 0], r: [1, 0] },
  { count: 3, l: [2, 0, 1], r: [1, 2, 0] },
  { count: 4, l: [3, 0, 1, 2], r: [1, 2, 3, 0] },
];
describe("Expanded simultaneous hand transfers", () => {
  for (const { count, l, r } of mappings) for (const kind of ["left", "right"] as const) {
    it.each([1, -1] as const)(`${kind} transfers ${count} seats by fixed order regardless of previous direction %i`, previous => {
      const hands = [[kind === "left" ? left("change") : right("change"), num("keep-a")], ...Array.from({ length: count - 1 }, (_, i) => Array.from({ length: i + 2 }, (_, j) => num(`held-${i}-${j}`)))];
      const game = fixture(hands, stock(4), num("top", "blue", 7)); game.direction = previous;
      const before = structuredClone(game); const outgoing = hands.map(hand => hand.filter(card => card.id !== "change").map(card => card.id));
      const result = play(game, "change", { declareUno: true }); const next = result.state;
      const mapping = kind === "left" ? l : r;
      expect(next.players.map(player => player.hand.map(card => card.id))).toEqual(mapping.map(source => outgoing[source]));
      expect(next.direction).toBe(kind === "left" ? 1 : -1); expect(next.currentIndex).toBe(kind === "left" ? 1 : count - 1);
      expect(next.discardPile.at(-1)!.id).toBe("change"); expect(next.drawPile).toEqual(game.drawPile);
      expect(new Set(next.players.map(player => player.hand)).size).toBe(count);
      for (const card of outgoing.flat()) expect(JSON.stringify(result.events)).not.toContain('"' + card + '"');
      expect(game).toEqual(before); conserved(game, next);
      for (const player of next.players) expect(getExpandedPlayerView(next, player.id).self.hand).toEqual(player.hand);
    });
  }
  it("does not penalize someone who receives one card, including the actor after discarding from three", () => {
    const game = fixture([[left("change"), num("a"), num("b")], [num("other-a"), num("other-b")], [black("received")]], stock(4));
    const result = play(game, "change");
    expect(result.state.players[0]!.hand.map(card => card.id)).toEqual(["received"]);
    expect(result.events.public.some(event => event.type === "UNO_PENALTY" || event.type === "CARDS_DRAWN")).toBe(false);
    expect(() => play(game, "change", { declareUno: true })).toThrow("INVALID_UNO_CALL"); conserved(game, result.state);
  });
  it("a forgotten active two-to-one UNO penalty follows the actor after the transfer", () => {
    const game = fixture([[left("change"), num("outgoing")], [num("other-a"), num("other-b")], [num("received-a"), num("received-b"), num("received-c")]], stock(5));
    const result = play(game, "change"); const next = result.state;
    expect(next.players[0]!.hand.map(card => card.id)).toEqual(["received-a", "received-b", "received-c", "stock-0", "stock-1"]);
    expect(next.players[1]!.hand.map(card => card.id)).toEqual(["outgoing"]);
    expect(result.events.public).toContainEqual({ type: "UNO_PENALTY", playerId: "p0" });
    expect(result.events.public.filter(event => event.type === "CARDS_DRAWN")).toEqual([{ type: "CARDS_DRAWN", playerId: "p0", count: 2, reason: "uno" }]); conserved(game, next);
  });
  it("never activates effects of the cards received or sent", () => {
    const game = fixture([[right("change"), num("outgoing")], [colored("two", "draw-two")], [black("eight", "wild-draw-eight")]], stock(4), num("top", "blue", 7));
    const result = play(game, "change", { declareUno: true });
    expect(result.state.pendingDraw).toBe(0); expect(result.state.phase).toBe("turn"); expect(result.state.drawPile).toEqual(game.drawPile);
    expect(result.events.public.filter(event => event.type === "CARD_PLAYED")).toHaveLength(1); conserved(game, result.state);
  });
  it.each(["left", "right"] as const)("wins with the final %s before passing an empty hand", kind => {
    const game = fixture([[kind === "left" ? left("last") : right("last")], [num("other-a")], [num("other-b")]], stock(4), num("top", "blue", 7));
    const result = play(game, "last");
    expect(result.state.phase).toBe("ended"); expect(result.state.result!.winnerId).toBe("p0");
    expect(result.state.players[1]!.hand).toEqual(game.players[1]!.hand); expect(result.state.players[2]!.hand).toEqual(game.players[2]!.hand);
    expect(result.events.public.some(event => event.type === "HANDS_PASSED")).toBe(false); conserved(game, result.state);
  });
});

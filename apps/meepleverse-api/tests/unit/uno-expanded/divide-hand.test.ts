import { describe, expect, it } from "vitest";
import { applyExpandedCommand } from "../../../src/modules/games/uno-expanded/index.js";
import { fixture, num, black, stock, play, conserved } from "./fixtures.js";
describe("Expanded divide-two", () => {
  it.each([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])("discards floor(N/2) after activation for N=%i", count => {
    const remaining = Array.from({ length: count }, (_, i) => num("held-" + i));
    const game = fixture([[black("divide", "wild-divide-two"), ...remaining], [num("other")]], stock(4));
    const discarded = remaining.slice(0, Math.floor(count / 2)).map(card => card.id);
    const kept = count - discarded.length;
    const result = play(game, "divide", { chosenColor: "blue", discardCardIds: discarded, declareUno: kept === 1 });
    expect(result.state.players[0]!.hand).toHaveLength(kept); expect(result.state.activeColor).toBe("blue");
    expect(result.state.discardPile.at(-1)!.id).toBe("divide"); expect(result.state.drawPile).toHaveLength(4 + discarded.length);
    expect(result.state.phase).toBe(kept === 0 ? "ended" : "turn"); conserved(game, result.state);
    expect(result.events.public).toContainEqual({ type: "HAND_REDUCED", playerId: "p0", count: discarded.length });
  });
  it("uses hand order rather than client order at the bottom, below the existing stock", () => {
    const game = fixture([[black("divide", "wild-divide-two"), num("a"), black("b"), num("c"), num("d"), num("e")], [num("other")]], stock(3));
    const first = play(game, "divide", { chosenColor: "green", discardCardIds: ["c", "a"] });
    const second = play(game, "divide", { chosenColor: "green", discardCardIds: ["a", "c"] });
    expect(first.state).toEqual(second.state);
    const stockIds = [...first.state.drawPile].reverse().map(card => card.id);
    expect(stockIds).toEqual(["stock-0", "stock-1", "stock-2", "a", "c"]);
    expect(first.state.players[0]!.hand.map(card => card.id)).toEqual(["b", "d", "e"]);
  });
  it.each([undefined, [], ["a"], ["a", "a"], ["a", "outsider"], ["a", "other"], ["a", "divide"], ["a", "b", "c"]])("rejects invalid selection %j atomically", discardCardIds => {
    const game = fixture([[black("divide", "wild-divide-two"), num("a"), num("b"), num("c"), num("d")], [num("other")]], stock(4));
    const before = structuredClone(game);
    expect(() => play(game, "divide", { chosenColor: "red", discardCardIds })).toThrow("INVALID_SELECTION"); expect(game).toEqual(before);
  });
  it("permits an omitted zero-sized selection and does not reveal released faces or IDs", () => {
    const game = fixture([[black("divide", "wild-divide-two"), num("secret-a"), black("secret-b"), num("keep-c"), num("keep-d")], [num("other")]], stock(4));
    const result = play(game, "divide", { chosenColor: "red", discardCardIds: ["secret-a", "secret-b"] });
    expect(JSON.stringify(result.events)).not.toContain("secret-a"); expect(JSON.stringify(result.events)).not.toContain("secret-b");
    const small = fixture([[black("divide", "wild-divide-two"), num("keep")], [num("other")]], stock(3));
    expect(play(small, "divide", { chosenColor: "red", declareUno: true }).state.players[0]!.hand).toHaveLength(1);
  });
  it("requires UNO for three-to-one and penalizes the actor for forgetting it", () => {
    const game = fixture([[black("divide", "wild-divide-two"), num("a"), num("b")], [num("other")]], stock(4));
    const missed = play(game, "divide", { chosenColor: "red", discardCardIds: ["a"] });
    const declared = play(game, "divide", { chosenColor: "red", discardCardIds: ["a"], declareUno: true });
    expect(missed.state.players[0]!.hand).toHaveLength(3); expect(declared.state.players[0]!.hand).toHaveLength(1);
    expect(missed.events.public).toContainEqual({ type: "UNO_PENALTY", playerId: "p0" }); conserved(game, missed.state);
  });
  it("rejects malformed selections, irrelevant payloads and declaration when not going down to one", () => {
    const game = fixture([[black("divide", "wild-divide-two"), num("a"), num("b"), num("c"), num("d")], [num("other")]]);
    expect(() => applyExpandedCommand(game, "p0", { type: "PLAY_CARD", cardId: "divide", chosenColor: "red", discardCardIds: [5] })).toThrow("INVALID_COMMAND");
    expect(() => play(game, "divide", { chosenColor: "red", discardCardIds: ["a", "b"], declareUno: true })).toThrow("INVALID_UNO_CALL");
    expect(() => play(game, "a", { discardCardIds: [] })).toThrow("INVALID_SELECTION");
    expect(() => play(game, "divide", { chosenColor: "red", discardCardIds: ["a", "b"], targetPlayerId: "p1" })).toThrow("INVALID_TARGET");
  });
});

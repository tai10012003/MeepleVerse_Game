import { describe, expect, it } from "vitest";
import type { UnoExpandedCard } from "@meepleverse/contracts/uno-expanded";
import { fixture, num, colored, black, stock, play, conserved } from "./fixtures.js";
describe("Expanded forced draws", () => {
  it("Tornado ignores Wilds, keeps the first matching colored action and skips its recipient", () => {
    const game = fixture([[colored("tornado", "tornado", "green"), num("keep")], [num("b")], [num("c")]],
      [black("w"), black("shield", "wild-shield"), num("red"), colored("stop", "reverse", "green"), num("untouched")], num("top", "green"));
    const result = play(game, "tornado", { declareUno: true }); const next = result.state;
    expect(next.players[1]!.hand.map(card => card.id)).toEqual(["b", "w", "shield", "red", "stop"]);
    expect(next.direction).toBe(1); expect(next.currentIndex).toBe(2); expect(next.drawPile.at(-1)!.id).toBe("untouched");
    expect(JSON.stringify(result.events)).not.toContain('"stop"'); expect(JSON.stringify(result.events)).not.toContain('"shield"'); conserved(game, next);
  });
  it("Tornado recycles old discards once, preserves its top and terminates when the color does not exist", () => {
    const game = fixture([[colored("tornado", "tornado", "green"), num("keep")], [num("b")]], [black("wild"), num("red")], num("top", "green"));
    // An older green discard is recycled and can end the draw; the played Tornado stays on top.
    const next = play(game, "tornado", { declareUno: true }).state;
    expect(next.players[1]!.hand).toHaveLength(4); expect(next.discardPile.map(card => card.id)).toEqual(["tornado"]); conserved(game, next);
    const exhausted = fixture([[colored("tornado", "tornado", "green"), num("keep")], [num("b")]], [black("wild"), num("red")], black("top"));
    exhausted.activeColor = "green";
    const result = play(exhausted, "tornado", { declareUno: true });
    expect(result.state.drawPile).toEqual([]); expect(result.state.players[1]!.hand).toHaveLength(4);
    expect(result.state.phase).toBe("turn"); expect(result.state.currentIndex).toBe(0); conserved(exhausted, result.state);
  });
  it.each([0, 5, 9])("Random retains a revealed %i and draws that many additional private cards", value => {
    const game = fixture([[black("random", "wild-random"), num("keep")], [num("b")], [num("c")]], [num("reveal", "blue", value), ...stock(12)]);
    const result = play(game, "random", { chosenColor: "green", declareUno: true });
    expect(result.state.players[1]!.hand).toHaveLength(2 + value); expect(result.state.currentIndex).toBe(2);
    expect(result.state.activeColor).toBe("green"); expect(result.state.discardPile.at(-1)!.id).toBe("random");
    expect(result.events.public).toContainEqual({ type: "RANDOM_REVEALED", playerId: "p1", card: num("reveal", "blue", value) });
    for (const hidden of stock(12)) expect(JSON.stringify(result.events)).not.toContain('"' + hidden.id + '"'); conserved(game, result.state);
  });
  it.each([
    colored("reveal", "draw-two"), black("reveal", "wild-draw-eight"), black("reveal", "wild-shield"),
    { id: "reveal", kind: "high-five", color: "red", value: 5 },
    { id: "reveal", kind: "seven-change-left", color: "yellow", value: 7 },
  ] satisfies UnoExpandedCard[])("Random never triggers or counts the printed value of $kind", reveal => {
    const game = fixture([[black("random", "wild-random"), num("keep")], [num("b")]], [reveal, ...stock(8)]);
    const next = play(game, "random", { chosenColor: "blue", declareUno: true }).state;
    expect(next.players[1]!.hand).toHaveLength(2); expect(next.pendingDraw).toBe(0); expect(next.activeColor).toBe("blue");
    expect(next.direction).toBe(1); expect(next.currentIndex).toBe(0); expect(next.drawPile).toHaveLength(8);
  });
  it("Random shortage still retains every available card and never creates a card", () => {
    const game = fixture([[black("random", "wild-random"), num("keep")], [num("b")]], [num("reveal", "blue", 9)]);
    const next = play(game, "random", { chosenColor: "red", declareUno: true }).state;
    expect(next.players[1]!.hand.map(card => card.id).sort()).toEqual(["b", "reveal", "top"]); expect(next.drawPile).toEqual([]); conserved(game, next);
  });
  it.each([1, 7, 13])("x2 draws exactly the recipient's pre-effect %i cards and skips them", count => {
    const held = Array.from({ length: count }, (_, i) => num("held-" + i));
    const game = fixture([[black("multiply", "wild-multiply-two"), num("keep")], held, [num("c")]], stock(30));
    const result = play(game, "multiply", { chosenColor: "yellow", declareUno: true });
    expect(result.state.players[1]!.hand).toHaveLength(count * 2); expect(result.state.currentIndex).toBe(2); expect(result.state.pendingDraw).toBe(0); conserved(game, result.state);
  });
  it("x2 cannot be interrupted by Shield and clamps to available stock", () => {
    const game = fixture([[black("multiply", "wild-multiply-two"), num("keep")], [black("shield", "wild-shield"), num("b"), num("c"), num("d")]], []);
    const next = play(game, "multiply", { chosenColor: "blue", declareUno: true }).state;
    expect(next.players[1]!.hand).toHaveLength(5); expect(next.players[1]!.hand[0]!.id).toBe("shield");
    expect(next.phase).toBe("turn"); expect(next.currentIndex).toBe(0); conserved(game, next);
  });
});

import { describe, expect, it } from "vitest";
import { applyCommand, getPlayerView } from "../../../src/modules/games/uno/index.js";
import { fixture, number, wild } from "./fixtures.js";
function pending(illegal = false) {
  return applyCommand(fixture([[wild("four", "wild-draw-four"), number("held", illegal ? "red" : "blue", 1)], [number("other")], [number("third")]]),
    "p0", { type: "PLAY_CARD", cardId: "four", chosenColor: "green", declareUno: true }).state;
}
describe("Draw Four challenge", () => {
  it("accepts a bluff without leaking the legality", () => {
    const game = pending(true);
    const view = getPlayerView(game, "p1");
    expect(view.pendingDrawFour).toEqual({ offenderId: "p0", challengerId: "p1" });
    expect(JSON.stringify(view)).not.toContain("hadMatchingColor");
    expect(JSON.stringify(view)).not.toContain("held");
    const next = applyCommand(game, "p1", { type: "ACCEPT_DRAW_FOUR" });
    expect(next.state.players[1]!.hand).toHaveLength(5);
    expect(next.state.currentIndex).toBe(2);
    expect(next.events.private).toHaveLength(0);
  });
  it("makes a guilty offender draw four; challenger keeps the turn", () => {
    const game = pending(true);
    const next = applyCommand(game, "p1", { type: "CHALLENGE_DRAW_FOUR" });
    expect(next.state.players[0]!.hand).toHaveLength(5);
    expect(next.state.players[1]!.hand).toHaveLength(1);
    expect(next.state.currentIndex).toBe(1);
    expect(next.state.activeColor).toBe("green");
    expect(next.events.private[0]?.recipientId).toBe("p1");
    expect(next.events.private[0]?.cards.map(card => card.id)).toEqual(["four", "held"]);
  });
  it("makes an unsuccessful challenger draw six and skip", () => {
    const next = applyCommand(pending(), "p1", { type: "CHALLENGE_DRAW_FOUR" });
    expect(next.state.players[1]!.hand).toHaveLength(7);
    expect(next.state.currentIndex).toBe(2);
  });
  it("uses color rather than matching number as evidence", () => {
    const game = fixture([[wild("four", "wild-draw-four"), number("held", "blue", 7)], [number("other")]]);
    const pending = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "four", chosenColor: "yellow" }).state;
    expect(pending.pendingDrawFour?.hadMatchingColor).toBe(false);
  });
  it("locks normal actions and limits the decision to the target", () => {
    const game = pending();
    expect(() => applyCommand(game, "p2", { type: "CHALLENGE_DRAW_FOUR" })).toThrow("NOT_YOUR_TURN");
    expect(() => applyCommand(game, "p1", { type: "DRAW_CARD" })).toThrow("INVALID_PHASE");
    expect(() => applyCommand(game, "p1", { type: "PLAY_CARD", cardId: "other" })).toThrow("INVALID_PHASE");
  });
  it("captures evidence before an UNO penalty changes the offender hand", () => {
    const game = fixture([[wild("four", "wild-draw-four"), number("held", "blue", 1)], [number("other")], [number("third")]]);
    const penalized = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "four", chosenColor: "green" }).state;
    expect(penalized.players[0]!.hand).toHaveLength(3);
    const next = applyCommand(penalized, "p1", { type: "CHALLENGE_DRAW_FOUR" });
    expect(next.events.public).toContainEqual({ type: "DRAW_FOUR_RESOLVED", challenged: true, successful: false });
    expect(next.events.private[0]!.cards).toHaveLength(2);
  });
});

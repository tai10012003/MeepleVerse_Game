import { describe, expect, it } from "vitest";
import { applyCommand } from "../../../src/modules/games/uno/index.js";
import { fixture, number, wild, action } from "./fixtures.js";
const ready = () => applyCommand(fixture([[number("play"), number("stay")], [number("opponent")]]), "p0", { type: "PLAY_CARD", cardId: "play" }).state;
describe("UNO declaration and results", () => {
  it("supports atomic declaration on play", () => {
    const game = fixture([[number("play"), number("stay")], [number("other")]]);
    const next = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "play", declareUno: true });
    expect(next.state.unoTargetId).toBeNull();
    expect(next.events.public).toContainEqual({ type: "UNO_CALLED", playerId: "p0" });
  });
  it("allows late declaration before being caught", () => {
    const next = applyCommand(ready(), "p0", { type: "CALL_UNO" }).state;
    expect(next.unoTargetId).toBeNull();
    expect(() => applyCommand(next, "p1", { type: "CATCH_UNO", targetId: "p0" })).toThrow("INVALID_UNO_CALL");
  });
  it("penalizes a caught player once without consuming the current turn", () => {
    const next = applyCommand(ready(), "p1", { type: "CATCH_UNO", targetId: "p0" }).state;
    expect(next.players[0]!.hand).toHaveLength(3);
    expect(next.currentIndex).toBe(1);
    expect(() => applyCommand(next, "p1", { type: "CATCH_UNO", targetId: "p0" })).toThrow("INVALID_UNO_CALL");
  });
  it("keeps the window after invalid actions; closes on the next accepted turn action", () => {
    const game = ready();
    expect(() => applyCommand(game, "p1", { type: "PLAY_CARD", cardId: "unknown" })).toThrow();
    expect(game.unoTargetId).toBe("p0");
    const next = applyCommand(game, "p1", { type: "DRAW_CARD" }).state;
    expect(next.unoTargetId).toBeNull();
  });
  it("scores remaining cards and rejects actions after a win", () => {
    const game = fixture([[number("last")], [number("n", "blue", 3), action("s", "skip"), wild("w")]]);
    const next = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "last" }).state;
    expect(next.result).toEqual({ winnerId: "p0", reason: "empty-hand", winnerScore: 73, handPoints: { p0: 0, p1: 73 } });
    expect(() => applyCommand(next, "p1", { type: "DRAW_CARD" })).toThrow("GAME_ENDED");
  });
  it("applies the final Draw Two before scoring", () => {
    const game = fixture([[action("last", "draw-two")], [number("other")]], [number("draw1", "blue", 3), number("draw2", "green", 2)]);
    const next = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "last" }).state;
    expect(next.players[1]!.hand).toHaveLength(3);
    expect(next.result?.winnerScore).toBe(12);
  });
  it.each(["ACCEPT_DRAW_FOUR", "CHALLENGE_DRAW_FOUR"] as const)("defers a final Draw Four until %s", type => {
    const game = fixture([[wild("last", "wild-draw-four")], [number("other")]]);
    const pending = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "last", chosenColor: "red" }).state;
    expect(pending.result).toBeNull();
    expect(pending.phase).toBe("draw-four");
    const next = applyCommand(pending, "p1", { type }).state;
    expect(next.result?.winnerId).toBe("p0");
    expect(next.players[1]!.hand).toHaveLength(type === "ACCEPT_DRAW_FOUR" ? 5 : 7);
  });
});

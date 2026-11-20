import { describe, expect, it } from "vitest";
import type { UnoExpandedCard } from "@meepleverse/contracts/uno-expanded";
import { getExpandedPlayerView } from "../../../src/modules/games/uno-expanded/index.js";
import { fixture, num, colored, black, stock, play, step, conserved } from "./fixtures.js";
describe("Expanded fixed debt and defense", () => {
  it("stacks +2/+6/+8 across colors, accepts 16, skips the recipient and retains the final color", () => {
    const game = fixture([[colored("two", "draw-two"), num("a")], [black("six", "wild-draw-six"), num("b")], [black("eight", "wild-draw-eight"), num("c")], [num("d")]], stock(30));
    let next = play(game, "two", { declareUno: true }).state;
    next = play(next, "six", { chosenColor: "blue", declareUno: true }).state;
    next = play(next, "eight", { chosenColor: "green", declareUno: true }).state;
    expect(next.pendingDraw).toBe(16); expect(next.currentIndex).toBe(3);
    const accepted = step(next, { type: "ACCEPT_DRAW_PENALTY" });
    expect(accepted.state.players[3]!.hand).toHaveLength(17); expect(accepted.state.currentIndex).toBe(0);
    expect(accepted.state.activeColor).toBe("green"); expect(accepted.state.pendingDraw).toBe(0); conserved(game, accepted.state);
  });
  it("allows a lower +2 on +8 regardless of color and never caps the chain at eight", () => {
    const game = fixture([[black("eight", "wild-draw-eight"), num("a")], [colored("two", "draw-two", "blue"), num("b")], [num("c")]], stock(20));
    const next = play(play(game, "eight", { chosenColor: "red", declareUno: true }).state, "two", { declareUno: true }).state;
    expect(next.pendingDraw).toBe(10); expect(next.activeColor).toBe("blue");
  });
  it("Target +4 redirects the debt without reordering seats; acceptance continues after the target", () => {
    const game = fixture([[colored("two", "draw-two"), num("a")], [black("target", "wild-target-four"), num("b")], [num("c")], [num("d")]], stock(20));
    let next = play(game, "two", { declareUno: true }).state;
    next = play(next, "target", { chosenColor: "yellow", targetPlayerId: "p3", declareUno: true }).state;
    expect(next.currentIndex).toBe(3); expect(next.pendingDraw).toBe(6);
    next = step(next, { type: "ACCEPT_DRAW_PENALTY" }).state;
    expect(next.currentIndex).toBe(0); expect(next.players.map(player => player.id)).toEqual(["p0", "p1", "p2", "p3"]);
    conserved(game, next);
  });
  it("Target follows reverse direction when continuing after a remote recipient", () => {
    const game = fixture([[black("target", "wild-target-four"), num("a")], [num("b")], [num("c")], [num("d")]], stock(10)); game.direction = -1;
    const next = step(play(game, "target", { chosenColor: "blue", targetPlayerId: "p2", declareUno: true }).state, { type: "ACCEPT_DRAW_PENALTY" }).state;
    expect(next.currentIndex).toBe(1);
  });
  it.each([undefined, "p0", "outsider"])("rejects invalid Target selection %s without changing the state", targetPlayerId => {
    const game = fixture([[black("target", "wild-target-four"), num("a")], [num("b")]], stock(10)); const before = structuredClone(game);
    expect(() => play(game, "target", { chosenColor: "blue", targetPlayerId, declareUno: true })).toThrow("INVALID_TARGET"); expect(game).toEqual(before);
  });
  it("Shield forwards the same debt; a direct +2 response is forbidden even in the selected color", () => {
    const game = fixture([[black("four", "wild-draw-four"), num("a")], [black("shield", "wild-shield"), num("b")], [colored("two", "draw-two", "green"), black("six", "wild-draw-six"), num("c")]], stock(20));
    let next = play(game, "four", { chosenColor: "red", declareUno: true }).state;
    next = play(next, "shield", { chosenColor: "green", declareUno: true }).state;
    expect(next.pendingDraw).toBe(4); expect(next.currentIndex).toBe(2);
    expect(getExpandedPlayerView(next, "p2").self.playableCardIds).toEqual(["six"]);
    expect(() => play(next, "two")).toThrow("CARD_NOT_PLAYABLE");
    next = play(next, "six", { chosenColor: "blue" }).state; expect(next.pendingDraw).toBe(10);
    expect(next.currentIndex).toBe(0); conserved(game, next);
  });
  it.each(["wild-draw-four", "wild-draw-six", "wild-draw-eight", "wild-target-four", "wild-shield"] as const)("allows %s directly after Shield", kind => {
    const game = fixture([[black("response", kind), num("keep")], [num("b")], [num("c")]], stock(20), black("last", "wild-shield"));
    game.phase = "draw-stack"; game.pendingDraw = 6;
    const next = play(game, "response", { chosenColor: "red", declareUno: true, ...(kind === "wild-target-four" ? { targetPlayerId: "p2" } : {}) }).state;
    expect(next.pendingDraw).toBe(kind === "wild-shield" ? 6 : kind === "wild-draw-six" ? 12 : kind === "wild-draw-eight" ? 14 : 10);
  });
  it("Shield on a regular turn only changes color and adds no debt", () => {
    const game = fixture([[black("shield", "wild-shield"), num("keep")], [num("b")]], stock(5));
    const next = play(game, "shield", { chosenColor: "blue", declareUno: true }).state;
    expect(next.pendingDraw).toBe(0); expect(next.phase).toBe("turn"); expect(next.activeColor).toBe("blue");
  });
  it.each([num("bad"), colored("bad", "skip"), colored("bad", "reverse"), black("bad"), colored("bad", "tornado"), black("bad", "wild-random"), black("bad", "wild-multiply-two")] satisfies UnoExpandedCard[])("rejects $kind during a debt window", card => {
    const game = fixture([[card, num("keep")], [num("b")]], stock(8), black("top", "wild-draw-eight")); game.phase = "draw-stack"; game.pendingDraw = 8;
    expect(() => play(game, "bad", card.color === null ? { chosenColor: "red", declareUno: true } : { declareUno: true })).toThrow("CARD_NOT_PLAYABLE");
    expect(() => step(game, { type: "DRAW_CARD" })).toThrow("INVALID_PHASE");
    expect(() => step(game, { type: "PASS_TURN" })).toThrow("INVALID_PHASE");
  });
});

import { describe, expect, it } from "vitest";
import type { UnoExpandedCard } from "@meepleverse/contracts/uno-expanded";
import { applyExpandedCommand, getExpandedPlayerView } from "../../../src/modules/games/uno-expanded/index.js";
import { fixture, num, colored, black, stock, play, step, conserved } from "./fixtures.js";
describe("Expanded results, scarcity and rollback", () => {
  it.each([
    [colored("last", "draw-two"), 2], [black("last", "wild-draw-four"), 4],
    [black("last", "wild-draw-six"), 6], [black("last", "wild-draw-eight"), 8],
    [black("last", "wild-target-four"), 4],
  ] satisfies Array<[UnoExpandedCard, number]>)("settles a last $0.kind before counting points", (card, count) => {
    const game = fixture([[card], [num("b", "blue", 3)], [black("c")]], stock(20));
    const result = play(game, "last", { ...(card.color === null ? { chosenColor: "blue" as const } : {}), ...(card.kind === "wild-target-four" ? { targetPlayerId: "p2" } : {}) });
    const target = card.kind === "wild-target-four" ? 2 : 1;
    expect(result.state.phase).toBe("ended"); expect(result.state.players[target]!.hand).toHaveLength(count + 1);
    expect(result.state.result!.winnerId).toBe("p0"); expect(result.state.pendingDraw).toBe(0);
    expect(getExpandedPlayerView(result.state, "p0").currentPlayerId).toBeNull(); conserved(game, result.state);
    expect(() => step(result.state, { type: "DRAW_CARD" })).toThrow("GAME_ENDED");
  });
  it("a last Shield forwards and settles the existing debt before awarding the win", () => {
    const game = fixture([[black("last", "wild-shield")], [num("b")]], stock(20), black("previous", "wild-draw-eight"));
    game.phase = "draw-stack"; game.pendingDraw = 14;
    const next = play(game, "last", { chosenColor: "yellow" }).state;
    expect(next.players[1]!.hand).toHaveLength(15); expect(next.result!.winnerId).toBe("p0"); conserved(game, next);
  });
  it.each([colored("last", "tornado"), black("last", "wild-random"), black("last", "wild-multiply-two")] satisfies UnoExpandedCard[])("settles last-card $kind before ending", card => {
    const game = fixture([[card], [num("b")]], [num("stop", "red", 0), ...stock(10)]);
    const next = play(game, "last", card.color === null ? { chosenColor: "blue" } : {}).state;
    expect(next.players[1]!.hand).toHaveLength(2); expect(next.phase).toBe("ended"); expect(next.result!.winnerId).toBe("p0"); conserved(game, next);
  });
  it("scores colored special cards as 20 and black cards as 50 without leaking opponent faces", () => {
    const game = fixture([[num("last")], [{ id: "high", kind: "high-five", color: "blue", value: 5 }, black("secret")]]);
    const next = play(game, "last").state;
    expect(next.result).toEqual({ winnerId: "p0", reason: "empty-hand", winnerScore: 70, handPoints: { p0: 0, p1: 70 } });
    const view = getExpandedPlayerView(next, "p0");
    expect(JSON.stringify(view)).not.toContain('"secret"'); expect(JSON.stringify(view)).not.toContain('"high"');
  });
  it("accepts a partial debt with empty stock and preserves the top discard", () => {
    const game = fixture([[num("a")], [num("b")]], [], black("last", "wild-draw-eight"));
    game.phase = "draw-stack"; game.pendingDraw = 80;
    const result = step(game, { type: "ACCEPT_DRAW_PENALTY" });
    expect(result.state.players[0]!.hand).toHaveLength(1); expect(result.state.discardPile[0]!.id).toBe("last");
    expect(result.events.public).toContainEqual({ type: "DRAW_PENALTY_ACCEPTED", playerId: "p0", requestedCount: 80, count: 0 });
    expect(result.state.currentIndex).toBe(1); expect(result.state.pendingDraw).toBe(0); conserved(game, result.state);
  });
  it("ends a truly blocked round but never declares blocked if someone still holds a legal card", () => {
    const blocked = fixture([[num("a", "blue", 1)], [num("b", "green", 2)]]);
    const ended = step(step(blocked, { type: "DRAW_CARD" }).state, { type: "DRAW_CARD" }).state;
    expect(ended.result!.reason).toBe("blocked"); expect(ended.result!.winnerId).toBeNull();
    const playable = fixture([[num("a")], [num("b", "green", 2)]]);
    const alive = step(step(playable, { type: "DRAW_CARD" }).state, { type: "DRAW_CARD" }).state;
    expect(alive.phase).toBe("turn"); expect(alive.result).toBeNull();
  });
  it("rolls back a played card and UNO penalty if recycling encounters invalid randomness", () => {
    const game = fixture([[num("play"), num("keep")], [num("other")]]);
    game.discardPile.push(num("older-top")); const before = structuredClone(game);
    expect(() => applyExpandedCommand(game, "p0", { type: "PLAY_CARD", cardId: "play" }, () => 1)).toThrow("INVALID_RANDOM");
    expect(game).toEqual(before);
  });
});

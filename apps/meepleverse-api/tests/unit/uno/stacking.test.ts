import { describe, expect, it } from "vitest";
import { applyCommand, getPlayerView } from "../../../src/modules/games/uno/index.js";
import { fixture, number, wild, action } from "./fixtures.js";
const stock = () => Array.from({ length: 30 }, (_, i) => number("stock-" + i));
const play = (cardId: string) => ({ type: "PLAY_CARD", cardId, declareUno: true });
describe("stacking penalties", () => {
  it("stacks +2/+4/+4 to ten, then the last +4 author chooses color and the recipient loses the turn", () => {
    let game = fixture([[action("two", "draw-two"), number("a")], [wild("four1", "wild-draw-four"), number("b")], [wild("four2", "wild-draw-four"), number("c")], [number("d")]], stock());
    for (const [actor, card, total] of [["p0", "two", 2], ["p1", "four1", 6], ["p2", "four2", 10]] as const) {
      game = applyCommand(game, actor, play(card)).state;
      expect(game.pendingDraw).toBe(total);
      expect(game.phase).toBe("draw-stack");
    }
    expect(game.players[3]!.hand).toHaveLength(1);
    game = applyCommand(game, "p3", { type: "ACCEPT_DRAW_PENALTY" }).state;
    expect(game.players[3]!.hand).toHaveLength(11);
    expect(game.phase).toBe("penalty-color"); expect(game.currentIndex).toBe(2); expect(game.pendingDraw).toBe(0);
    expect(() => applyCommand(game, "p0", { type: "CHOOSE_COLOR", color: "green" })).toThrow("NOT_YOUR_TURN");
    expect(() => applyCommand(game, "p3", { type: "CHOOSE_COLOR", color: "green" })).toThrow("NOT_YOUR_TURN");
    expect(() => applyCommand(game, "p2", { type: "PLAY_CARD", cardId: "d" })).toThrow("INVALID_PHASE");
    expect(() => applyCommand(game, "p2", { type: "ACCEPT_DRAW_PENALTY" })).toThrow("INVALID_PHASE");
    const next = applyCommand(game, "p2", { type: "CHOOSE_COLOR", color: "green" }).state;
    expect(next.activeColor).toBe("green"); expect(next.currentIndex).toBe(0); expect(next.phase).toBe("turn");
  });
  it("allows +2 on +4 regardless of color and retains the last +2 color", () => {
    let game = fixture([[wild("four", "wild-draw-four"), number("a")], [action("two", "draw-two", "blue"), number("b")], [number("c")]], stock());
    game = applyCommand(game, "p0", play("four")).state;
    expect(game.activeColor).toBeNull();
    game = applyCommand(game, "p1", play("two")).state;
    expect(game.pendingDraw).toBe(6);
    game = applyCommand(game, "p2", { type: "ACCEPT_DRAW_PENALTY" }).state;
    expect(game.activeColor).toBe("blue"); expect(game.currentIndex).toBe(0); expect(game.phase).toBe("turn");
  });
  it("lets the target accept even when they own another penalty card, following reverse direction", () => {
    let game = fixture([[action("two", "draw-two"), number("a")], [number("b")], [wild("four", "wild-draw-four"), number("c")]], stock());
    game.direction = -1;
    game = applyCommand(game, "p0", play("two")).state;
    expect(game.currentIndex).toBe(2);
    game = applyCommand(game, "p2", { type: "ACCEPT_DRAW_PENALTY" }).state;
    expect(game.currentIndex).toBe(1); expect(game.players[2]!.hand).toHaveLength(4);
  });
  it.each([number("blocked"), action("blocked", "skip"), action("blocked", "reverse"), wild("blocked")])("rejects non-penalty $kind cards during a chain without mutation", card => {
    let game = fixture([[action("two", "draw-two"), number("a")], [card, number("b")]], stock());
    game = applyCommand(game, "p0", play("two")).state;
    const before = structuredClone(game);
    expect(() => applyCommand(game, "p1", { type: "PLAY_CARD", cardId: "blocked", ...(card.kind === "wild" ? { chosenColor: "red" } : {}) })).toThrow("CARD_NOT_PLAYABLE");
    for (const type of ["DRAW_CARD", "PASS_TURN", "CHOOSE_COLOR"] as const) expect(() => applyCommand(game, "p1", { type, ...(type === "CHOOSE_COLOR" ? { color: "red" } : {}) })).toThrow("INVALID_PHASE");
    expect(game).toEqual(before);
    expect(() => applyCommand(game, "p0", { type: "ACCEPT_DRAW_PENALTY" })).toThrow("NOT_YOUR_TURN");
  });
  it("keeps the UNO penalty separate from the running debt", () => {
    let game = fixture([[action("two", "draw-two"), number("a")], [wild("four", "wild-draw-four"), number("b")]], stock());
    const next = applyCommand(game, "p0", { type: "PLAY_CARD", cardId: "two" }); game = next.state;
    expect(game.players[0]!.hand).toHaveLength(3); expect(game.pendingDraw).toBe(2);
    expect(next.events.public).toContainEqual({ type: "UNO_PENALTY", playerId: "p0" });
    game = applyCommand(game, "p1", play("four")).state;
    expect(game.pendingDraw).toBe(6);
  });
  it.each([2, 3, 4] as const)("returns color choice to the +4 author with %i players in either direction", count => {
    for (const direction of [1, -1] as const) {
      let game = fixture(Array.from({ length: count }, (_, i) => i === 0 ? [wild("four", "wild-draw-four"), number("stay")] : [number("held-" + i)]), stock());
      game.direction = direction;
      game = applyCommand(game, "p0", play("four")).state;
      const recipientIndex = (count + direction) % count;
      game = applyCommand(game, "p" + recipientIndex, { type: "ACCEPT_DRAW_PENALTY" }).state;
      expect(game.players[recipientIndex]!.hand).toHaveLength(5);
      expect(game.currentIndex).toBe(0); expect(game.phase).toBe("penalty-color");
      expect(() => applyCommand(game, "p" + recipientIndex, { type: "CHOOSE_COLOR", color: "blue" })).toThrow("NOT_YOUR_TURN");
      game = applyCommand(game, "p0", { type: "CHOOSE_COLOR", color: "blue" }).state;
      expect(game.currentIndex).toBe((count + 2 * direction) % count);
      expect(game.activeColor).toBe("blue"); expect(game.phase).toBe("turn");
    }
  });
  it("allows unrestricted +4 but rejects choosing its color and obsolete challenge commands", () => {
    const game = fixture([[wild("four", "wild-draw-four"), number("same-color")], [number("other")]], stock());
    expect(() => applyCommand(game, "p0", { ...play("four"), chosenColor: "red" })).toThrow("INVALID_COLOR");
    const next = applyCommand(game, "p0", play("four")).state;
    for (const type of ["CHALLENGE_DRAW_FOUR", "ACCEPT_DRAW_FOUR"]) expect(() => applyCommand(next, "p1", { type })).toThrow("INVALID_COMMAND");
    expect(JSON.stringify(getPlayerView(next, "p1"))).not.toContain("same-color");
  });
  it.each(["draw-two", "wild-draw-four"] as const)("settles accumulated debt before scoring a final %s without another response", kind => {
    let game = fixture([[action("start", "draw-two"), number("a")], [kind === "draw-two" ? action("last", kind, "blue") : wild("last", kind)], [number("c")]], stock());
    game = applyCommand(game, "p0", play("start")).state;
    const final = applyCommand(game, "p1", { type: "PLAY_CARD", cardId: "last" });
    expect(final.state.phase).toBe("ended"); expect(final.state.result?.winnerId).toBe("p1");
    expect(final.state.players[2]!.hand).toHaveLength(kind === "draw-two" ? 5 : 7);
    expect(final.state.pendingDraw).toBe(0);
    expect(final.events.public.at(-1)?.type).toBe("GAME_ENDED");
  });
  it("recycles available cards without fabricating missing penalty cards", () => {
    let game = fixture([[wild("four", "wild-draw-four"), number("a")], [number("b")]], []);
    game = applyCommand(game, "p0", play("four")).state;
    game = applyCommand(game, "p1", { type: "ACCEPT_DRAW_PENALTY" }).state;
    expect(game.players[1]!.hand).toHaveLength(2); expect(game.discardPile.map(card => card.id)).toEqual(["four"]);
    expect(game.phase).toBe("penalty-color"); expect(game.pendingDraw).toBe(0);
  });
});

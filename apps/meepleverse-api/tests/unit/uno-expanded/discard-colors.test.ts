import { describe, expect, it } from "vitest";
import { fixture, num, colored, black, left, right, stock, play, conserved } from "./fixtures.js";
describe("Expanded color discards", () => {
  it("discards every matching number/action without their effects, preserving the activation on top", () => {
    const game = fixture([[colored("discard", "discard-color"), num("red"), colored("two", "draw-two"),
      { id: "five", kind: "high-five", color: "red", value: 5 }, left("seven"), colored("extra", "discard-color"), black("keep-wild"), num("keep-blue", "blue")], [num("other")]], stock(5));
    const result = play(game, "discard"); const next = result.state;
    expect(next.players[0]!.hand.map(card => card.id)).toEqual(["keep-wild", "keep-blue"]);
    expect(next.discardPile.map(card => card.id)).toEqual(["top", "red", "two", "five", "seven", "extra", "discard"]);
    expect(next.pendingDraw).toBe(0); expect(next.direction).toBe(1); expect(next.currentIndex).toBe(1); expect(next.drawPile).toEqual(game.drawPile);
    expect(result.events.public.filter(event => event.type === "CARD_PLAYED")).toHaveLength(1);
    expect(result.events.public.some(event => event.type === "CARDS_DRAWN" || event.type === "HANDS_PASSED")).toBe(false);
    conserved(game, next);
  });
  it("Wild Discard chooses one color, keeps other colors/black cards and never reverses via side cards", () => {
    const game = fixture([[black("discard", "wild-discard"), num("blue", "blue"), colored("reverse", "reverse", "blue"), right("seven", "blue"), num("red"), black("other-wild")], [num("other")]]);
    const result = play(game, "discard", { chosenColor: "blue" });
    expect(result.state.players[0]!.hand.map(card => card.id)).toEqual(["red", "other-wild"]);
    expect(result.state.activeColor).toBe("blue"); expect(result.state.direction).toBe(1);
    expect(result.state.discardPile.at(-1)!.id).toBe("discard"); conserved(game, result.state);
    const discarded = result.events.public.find(event => event.type === "COLOR_DISCARDED")!;
    expect(discarded.type).toBe("COLOR_DISCARDED");
    if (discarded.type === "COLOR_DISCARDED") discarded.cards[0]!.id = "changed-event";
    expect(result.state.discardPile.some(card => card.id === "changed-event")).toBe(false);
  });
  it.each(["discard-color", "wild-discard"] as const)("allows %s without auxiliary cards", kind => {
    const card = kind === "discard-color" ? colored("discard", kind) : black("discard", kind);
    const game = fixture([[card, num("keep", "blue")], [num("other")]]);
    const next = play(game, "discard", { declareUno: true, ...(kind === "wild-discard" ? { chosenColor: "red" as const } : {}) }).state;
    expect(next.players[0]!.hand).toHaveLength(1); expect(next.discardPile.at(-1)!.id).toBe("discard");
  });
  it("supports many-to-one UNO and never re-discards the matching cards drawn as a penalty", () => {
    const game = fixture([[colored("discard", "discard-color"), num("a"), num("b"), num("keep", "blue")], [num("other")]], [num("penalty-a"), num("penalty-b")]);
    const missed = play(game, "discard"); const declared = play(game, "discard", { declareUno: true });
    expect(missed.state.players[0]!.hand.map(card => card.id)).toEqual(["keep", "penalty-a", "penalty-b"]);
    expect(declared.state.players[0]!.hand.map(card => card.id)).toEqual(["keep"]);
    expect(missed.events.public).toContainEqual({ type: "UNO_PENALTY", playerId: "p0" }); conserved(game, missed.state);
  });
  it.each(["discard-color", "wild-discard"] as const)("wins when %s clears the hand, without activating side-card penalties", kind => {
    const card = kind === "discard-color" ? colored("discard", kind) : black("discard", kind);
    const game = fixture([[card, colored("eight-not", "draw-two"), left("seven")], [num("other", "blue", 3)]], stock(10));
    const result = play(game, "discard", kind === "wild-discard" ? { chosenColor: "red" } : {});
    expect(result.state.phase).toBe("ended"); expect(result.state.result!.winnerId).toBe("p0");
    expect(result.state.players[1]!.hand).toHaveLength(1); expect(result.state.result!.winnerScore).toBe(3); conserved(game, result.state);
  });
  it("does not let the client choose partial colors, side-card ordering, targets or a false UNO declaration", () => {
    const game = fixture([[colored("discard", "discard-color"), num("a"), num("b")], [num("other")]]); const before = structuredClone(game);
    expect(() => play(game, "discard", { discardCardIds: ["a"] })).toThrow("INVALID_SELECTION");
    expect(() => play(game, "discard", { declareUno: true })).toThrow("INVALID_UNO_CALL");
    expect(() => play(game, "discard", { chosenColor: "blue" })).toThrow("INVALID_COLOR");
    expect(() => play(game, "discard", { targetPlayerId: "p1" })).toThrow("INVALID_TARGET"); expect(game).toEqual(before);
    const wild = fixture([[black("discard", "wild-discard"), num("a")], [num("other")]]);
    expect(() => play(wild, "discard")).toThrow("INVALID_COLOR");
  });
});

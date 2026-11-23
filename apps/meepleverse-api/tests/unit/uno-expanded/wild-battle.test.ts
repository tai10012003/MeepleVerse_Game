import { describe, expect, it } from "vitest";
import { getExpandedPlayerView } from "../../../src/modules/games/uno-expanded/index.js";
import { fixture, num, black, left, stock, conserved } from "./fixtures.js";
import { act, tick, effectId } from "./mini-fixtures.js";
function setup() {
  const game = fixture([[black("battle", "wild-battle"), num("secret-nine", "red", 9), num("keep-a", "blue"), num("keep-b", "yellow"), black("keep-c")],
    [num("secret-three", "red", 3), num("opponent-keep", "blue")], [num("observer")]], stock(20));
  return { original: game, state: act(game, "p0", { type: "PLAY_CARD", cardId: "battle", chosenColor: "red", targetPlayerId: "p1" }).state };
}
describe("Wild Battle", () => {
  it("locks cards in hand and exposes only readiness and the caller's own selection before simultaneous reveal", () => {
    const { original, state } = setup(); const id = effectId(state);
    const locked = act(state, "p0", { type: "BATTLE_SELECT", effectId: id, cardId: "secret-nine" });
    expect(locked.state.players[0]!.hand).toHaveLength(4); expect(locked.events.public).toEqual([]);
    expect(getExpandedPlayerView(locked.state, "p0").self.battle!.selectedCardId).toBe("secret-nine");
    for (const observer of ["p1", "p2"]) {
      const view = getExpandedPlayerView(locked.state, observer);
      expect(JSON.stringify(view)).not.toContain('"secret-nine"'); expect(view.effect).toMatchObject({ lockedPlayerIds: ["p0"], revealed: [] });
      expect(view.currentPlayerId).toBeNull();
    }
    expect(() => act(locked.state, "p0", { type: "BATTLE_SELECT", effectId: id, cardId: "secret-nine" })).toThrow("ALREADY_RESPONDED");
    const result = act(locked.state, "p1", { type: "BATTLE_SELECT", effectId: id, cardId: "secret-three", declareUno: true });
    expect(result.state.phase).toBe("battle-discard"); expect(result.state.effect).toMatchObject({ winnerId: "p0", rewardCount: 2 });
    expect(result.state.players[1]!.hand).toHaveLength(3); expect(result.state.discardPile.at(-1)!.id).toBe("battle");
    expect(result.events.public.some(event => event.type === "BATTLE_REVEALED")).toBe(true); conserved(original, result.state);
  });
  it.each([true, false])("awards exactly two chosen cards, checks reward UNO=%s and keeps the Battle color/top", declared => {
    const { original, state } = setup(); const id = effectId(state);
    let next = act(state, "p0", { type: "BATTLE_SELECT", effectId: id, cardId: "secret-nine" }).state;
    next = act(next, "p1", { type: "BATTLE_SELECT", effectId: id, cardId: "secret-three", declareUno: true }).state;
    expect(() => act(next, "p1", { type: "BATTLE_DISCARD", effectId: id, cardIds: ["keep-a", "keep-b"] })).toThrow("NOT_YOUR_TURN");
    for (const cardIds of [["keep-a"], ["keep-a", "keep-a"], ["keep-a", "battle"], ["keep-a", "opponent-keep"]]) {
      expect(() => act(next, "p0", { type: "BATTLE_DISCARD", effectId: id, cardIds })).toThrow("INVALID_SELECTION");
    }
    const result = act(next, "p0", { type: "BATTLE_DISCARD", effectId: id, cardIds: ["keep-b", "keep-a"], declareUno: declared });
    expect(result.state.players[0]!.hand).toHaveLength(declared ? 1 : 3); expect(result.state.currentIndex).toBe(1);
    expect(result.state.activeColor).toBe("red"); expect(result.state.discardPile.at(-1)!.id).toBe("battle"); expect(result.state.effect).toBeNull(); conserved(original, result.state);
  });
  it("handles one eligible side and neither eligible without accepting false no-card claims", () => {
    const one = fixture([[black("battle", "wild-battle"), num("only", "red", 9)], [num("other", "blue")]], stock(10));
    let next = act(one, "p0", { type: "PLAY_CARD", cardId: "battle", chosenColor: "red", targetPlayerId: "p1", declareUno: true }).state;
    expect(() => act(next, "p1", { type: "BATTLE_SELECT", effectId: effectId(next), cardId: "other" })).toThrow("NOT_YOUR_TURN");
    next = act(next, "p0", { type: "BATTLE_SELECT", effectId: effectId(next), cardId: "only" }).state;
    expect(next.result!.winnerId).toBe("p0"); expect(next.players[1]!.hand).toHaveLength(3); conserved(one, next);
    const neither = fixture([[black("battle", "wild-battle"), num("a", "blue")], [num("b", "blue")]], stock(10));
    const result = act(neither, "p0", { type: "PLAY_CARD", cardId: "battle", chosenColor: "red", targetPlayerId: "p1", declareUno: true }).state;
    expect(result.players[0]!.hand).toHaveLength(4); expect(result.players[1]!.hand).toHaveLength(3);
    expect(result.effect).toBeNull(); expect(result.currentIndex).toBe(1); conserved(neither, result);
  });
  it("lets the target win when only they have a matching number and resumes after the initiator", () => {
    const game = fixture([[black("battle", "wild-battle"), num("actor-keep", "blue")],
      [num("target-nine", "red", 9), black("reward-a"), black("reward-b"), num("target-keep", "yellow")], [num("observer")]], stock(10));
    let next = act(game, "p0", { type: "PLAY_CARD", cardId: "battle", chosenColor: "red", targetPlayerId: "p1", declareUno: true }).state;
    expect(getExpandedPlayerView(next, "p0").effect).toMatchObject({ lockedPlayerIds: ["p0"] });
    next = act(next, "p1", { type: "BATTLE_SELECT", effectId: effectId(next), cardId: "target-nine" }).state;
    expect(next.effect).toMatchObject({ winnerId: "p1", rewardCount: 2 }); expect(next.players[0]!.hand).toHaveLength(3);
    next = act(next, "p1", { type: "BATTLE_DISCARD", effectId: effectId(next), cardIds: ["reward-a", "reward-b"], declareUno: true }).state;
    expect(next.effect).toBeNull(); expect(next.currentIndex).toBe(1); expect(next.players[1]!.hand).toHaveLength(1); conserved(game, next);
  });
  it("resolves equal final cards as a simultaneous finish, independent of packet order", () => {
    const game = fixture([[black("battle", "wild-battle"), num("a", "red", 5)], [num("b", "red", 5)]], stock(8));
    const started = act(game, "p0", { type: "PLAY_CARD", cardId: "battle", chosenColor: "red", targetPlayerId: "p1", declareUno: true }).state;
    for (const order of [["p0", "p1"], ["p1", "p0"]]) {
      let next = started;
      for (const id of order) next = act(next, id, { type: "BATTLE_SELECT", effectId: effectId(next), cardId: id === "p0" ? "a" : "b" }).state;
      expect(next.result).toMatchObject({ winnerId: null, reason: "simultaneous-finish", winnerScore: 0 }); expect(next.effect).toBeNull(); conserved(game, next);
    }
  });
  it("uses 5/7 for comparison without side effects and forces the losing empty hand to draw before finishing", () => {
    const game = fixture([[black("battle", "wild-battle"), left("seven")], [{ id: "five", kind: "high-five", color: "red", value: 5 }]], stock(10));
    let next = act(game, "p0", { type: "PLAY_CARD", cardId: "battle", chosenColor: "red", targetPlayerId: "p1", declareUno: true }).state;
    next = act(next, "p0", { type: "BATTLE_SELECT", effectId: effectId(next), cardId: "seven" }).state;
    const result = act(next, "p1", { type: "BATTLE_SELECT", effectId: effectId(next), cardId: "five" });
    expect(result.state.result!.winnerId).toBe("p0"); expect(result.state.players[1]!.hand).toHaveLength(2); expect(result.state.direction).toBe(1);
    expect(result.events.public.some(event => event.type === "HANDS_PASSED" || event.type === "HIGH_FIVE_RESPONSE")).toBe(false); conserved(game, result.state);
  });
  it("refuses wrong-color, outsiders, stale effects, late choices and false UNO without mutation", () => {
    const { state } = setup(); const before = structuredClone(state); const id = effectId(state);
    expect(() => act(state, "p0", { type: "BATTLE_SELECT", effectId: id, cardId: "keep-a" })).toThrow("CARD_NOT_PLAYABLE");
    expect(() => act(state, "p2", { type: "BATTLE_SELECT", effectId: id, cardId: "observer" })).toThrow("NOT_YOUR_TURN");
    expect(() => act(state, "p0", { type: "BATTLE_SELECT", effectId: "old", cardId: "secret-nine" })).toThrow("STALE_EFFECT");
    expect(() => act(state, "p0", { type: "BATTLE_SELECT", effectId: id, cardId: "secret-nine" }, 30000)).toThrow("EFFECT_EXPIRED");
    expect(() => act(state, "p0", { type: "BATTLE_SELECT", effectId: id, cardId: "secret-nine", declareUno: true })).toThrow("INVALID_UNO_CALL");
    expect(state).toEqual(before);
  });
  it("times out missing choices/rewards deterministically and never declares UNO on behalf of a player", () => {
    const { original, state } = setup(); const id = effectId(state);
    const locked = act(state, "p0", { type: "BATTLE_SELECT", effectId: id, cardId: "secret-nine" }).state;
    expect(tick(locked, 29999)).toBeNull();
    const selected = tick(locked, 30000)!;
    expect(selected.state.players[1]!.hand).toHaveLength(5); // missed UNO (2) plus Battle loss (2)
    expect(selected.state.phase).toBe("battle-discard");
    const rewarded = tick(selected.state, 60000)!;
    expect(rewarded.state.players[0]!.hand).toHaveLength(3); // auto reward 3 -> 1, missed UNO -> 3
    expect(rewarded.state.effect).toBeNull(); expect(rewarded.events.public.some(event => event.type === "UNO_CALLED")).toBe(false); conserved(original, rewarded.state);
  });
});

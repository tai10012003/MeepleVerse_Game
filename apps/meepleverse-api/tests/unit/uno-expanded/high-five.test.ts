import { describe, expect, it } from "vitest";
import { applyExpandedCommand } from "../../../src/modules/games/uno-expanded/index.js";
import { fixture, num, stock, conserved } from "./fixtures.js";
import { act, tick, effectId } from "./mini-fixtures.js";
function setup(count = 4, direction: 1 | -1 = 1) {
  const game = fixture([[{ id: "five", kind: "high-five", color: "red", value: 5 }, num("a")], ...Array.from({ length: count - 1 }, (_, i) => [num("held-" + i)])], stock(12));
  game.direction = direction;
  return { original: game, state: act(game, "p0", { type: "PLAY_CARD", cardId: "five", declareUno: true }).state };
}
describe("High Five", () => {
  it("uses 1000ms preparation and 5000ms window, rejects early/late/spoofed input without mutation", () => {
    const { state } = setup(); expect(state.effect).toMatchObject({ kind: "high-five", attempt: 1, opensAt: 1000, deadline: 6000 });
    const before = structuredClone(state);
    const cmd = { type: "HIGH_FIVE" as const, effectId: effectId(state), attempt: 1 };
    expect(() => act(state, "p1", cmd, 999)).toThrow("EFFECT_NOT_OPEN");
    expect(() => act(state, "p1", cmd, 6000)).toThrow("EFFECT_EXPIRED");
    expect(act(state, "p0", cmd, 1000).state.effect).toMatchObject({ responseOrder: ["p0"] });
    expect(() => act(state, "p1", { ...cmd, attempt: 2 }, 1000)).toThrow("STALE_EFFECT");
    expect(() => applyExpandedCommand(state, "p1", { ...cmd, timestamp: 0 }, Math.random, { now: 1000 })).toThrow("INVALID_COMMAND");
    expect(state).toEqual(before); expect(tick(state, 999)).toBeNull();
  });
  it("ranks by server receipt, rejects duplicate slots and penalizes only the last responder", () => {
    const { original, state } = setup(); const cmd = { type: "HIGH_FIVE" as const, effectId: effectId(state), attempt: 1 };
    let next = act(state, "p2", cmd, 1000).state;
    expect(() => act(next, "p2", cmd, 1000)).toThrow("ALREADY_RESPONDED");
    next = act(next, "p1", cmd, 1000).state;
    next = act(next, "p0", cmd, 1000).state;
    next = act(next, "p3", cmd, 1000).state;
    expect(next.players.map(player => player.hand.length)).toEqual([1, 1, 1, 3]);
    expect(next.currentIndex).toBe(1); expect(next.phase).toBe("turn"); expect(next.effect).toBeNull(); conserved(original, next);
  });
  it.each([1, -1] as const)("penalizes every missing player in direction %i without charging responders", direction => {
    const { original, state } = setup(4, direction);
    const cmd = { type: "HIGH_FIVE" as const, effectId: effectId(state), attempt: 1 };
    const answered = act(state, "p2", cmd, 1000).state;
    const result = tick(answered, 6000)!;
    expect(result.state.players.map(player => player.hand.length)).toEqual([3, 3, 1, 3]);
    expect(result.events.public.filter(event => event.type === "HIGH_FIVE_RESOLVED")).toHaveLength(3);
    expect(result.state.currentIndex).toBe(direction === 1 ? 1 : 3);
    expect(tick(result.state, 50000)).toBeNull(); conserved(original, result.state);
  });
  it("keeps earlier responses and penalizes the sole missing responder on timeout", () => {
    const { state } = setup(); const cmd = { type: "HIGH_FIVE" as const, effectId: effectId(state), attempt: 1 };
    let next = act(state, "p3", cmd, 1000).state; next = act(next, "p1", cmd, 1100).state; next = act(next, "p0", cmd, 1100).state;
    const ended = tick(next, 6000)!;
    expect(ended.state.players[2]!.hand).toHaveLength(3); expect(ended.state.currentIndex).toBe(1);
    expect(ended.events.public.filter(event => event.type === "HIGH_FIVE_RESOLVED")).toHaveLength(1);
  });
  it("opens via a timer without drawing; two players also wait for both responses", () => {
    const { state } = setup(); const opened = tick(state, 1000)!;
    expect(opened.state.effect).toMatchObject({ stage: "active" }); expect(opened.state.players[1]!.hand).toHaveLength(1);
    expect(opened.state.revision).toBe(state.revision + 1);
    const pair = setup(2); expect(pair.state.effect).toMatchObject({ eligiblePlayerIds: ["p0", "p1"] });
    expect(pair.state.players[1]!.hand).toHaveLength(1);
  });
  it.each(["p0", "p1"])("penalizes %s when that player is last in a two-player game", last => {
    const { original, state } = setup(2); const first = last === "p0" ? "p1" : "p0";
    const cmd = { type: "HIGH_FIVE" as const, effectId: effectId(state), attempt: 1 };
    const answered = act(state, first, cmd, 1000).state;
    expect(answered.effect).not.toBeNull();
    const result = act(answered, last, cmd, 1100);
    expect(result.state.players.find(player => player.id === last)!.hand).toHaveLength(3);
    expect(result.state.players.find(player => player.id === first)!.hand).toHaveLength(1);
    expect(result.state.effect).toBeNull(); conserved(original, result.state);
  });
  it.each([2, 4])("penalizes everyone when nobody responds (%i players)", count => {
    const { original, state } = setup(count); const result = tick(state, 6000)!;
    expect(result.state.players.map(player => player.hand.length)).toEqual(Array(count).fill(3));
    expect(result.events.public.filter(event => event.type === "HIGH_FIVE_RESOLVED")).toHaveLength(count);
    expect(result.state.effect).toBeNull(); expect(tick(result.state, 6001)).toBeNull(); conserved(original, result.state);
  });
});

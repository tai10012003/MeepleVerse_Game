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
  it("uses 1500ms preparation and 8000ms window, rejects early/late/spoofed input without mutation", () => {
    const { state } = setup(); expect(state.effect).toMatchObject({ kind: "high-five", attempt: 1, opensAt: 1500, deadline: 9500 });
    const before = structuredClone(state);
    const cmd = { type: "HIGH_FIVE" as const, effectId: effectId(state), attempt: 1 };
    expect(() => act(state, "p1", cmd, 1499)).toThrow("EFFECT_NOT_OPEN");
    expect(() => act(state, "p1", cmd, 9500)).toThrow("EFFECT_EXPIRED");
    expect(() => act(state, "p0", cmd, 1500)).toThrow("NOT_YOUR_TURN");
    expect(() => act(state, "p1", { ...cmd, attempt: 2 }, 1500)).toThrow("STALE_EFFECT");
    expect(() => applyExpandedCommand(state, "p1", { ...cmd, timestamp: 0 }, Math.random, { now: 1500 })).toThrow("INVALID_COMMAND");
    expect(state).toEqual(before); expect(tick(state, 1499)).toBeNull();
  });
  it("ranks by server receipt, rejects duplicate slots and penalizes only the last responder", () => {
    const { original, state } = setup(); const cmd = { type: "HIGH_FIVE" as const, effectId: effectId(state), attempt: 1 };
    let next = act(state, "p2", cmd, 1500).state;
    expect(() => act(next, "p2", cmd, 1500)).toThrow("ALREADY_RESPONDED");
    next = act(next, "p1", cmd, 1500).state;
    next = act(next, "p3", cmd, 1500).state;
    expect(next.players.map(player => player.hand.length)).toEqual([1, 1, 1, 3]);
    expect(next.currentIndex).toBe(1); expect(next.phase).toBe("turn"); expect(next.effect).toBeNull(); conserved(original, next);
  });
  it.each([1, -1] as const)("chooses the first missing responder by seat order in direction %i", direction => {
    const { original, state } = setup(4, direction);
    const next = tick(state, 9500)!.state;
    const victim = direction === 1 ? 1 : 3;
    expect(next.players[victim]!.hand).toHaveLength(3); expect(next.currentIndex).toBe(victim);
    expect(tick(next, 50000)).toBeNull(); conserved(original, next);
  });
  it("keeps earlier responses and penalizes the sole missing responder on timeout", () => {
    const { state } = setup(); const cmd = { type: "HIGH_FIVE" as const, effectId: effectId(state), attempt: 1 };
    let next = act(state, "p3", cmd, 1500).state; next = act(next, "p1", cmd, 1600).state;
    const ended = tick(next, 9500)!;
    expect(ended.state.players[2]!.hand).toHaveLength(3); expect(ended.state.currentIndex).toBe(1);
    expect(ended.events.public.filter(event => event.type === "HIGH_FIVE_RESOLVED")).toHaveLength(1);
  });
  it("opens via a timer without drawing and handles two players immediately", () => {
    const { state } = setup(); const opened = tick(state, 1500)!;
    expect(opened.state.effect).toMatchObject({ stage: "active" }); expect(opened.state.players[1]!.hand).toHaveLength(1);
    expect(opened.state.revision).toBe(state.revision + 1);
    const pair = setup(2); expect(pair.state.effect).toBeNull(); expect(pair.state.players[1]!.hand).toHaveLength(3); expect(pair.state.currentIndex).toBe(1);
  });
});

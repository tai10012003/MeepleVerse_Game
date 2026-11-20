import { describe, expect, it } from "vitest";
import { fixture, num, black, stock, conserved } from "./fixtures.js";
import { act } from "./mini-fixtures.js";
import type { UnoExpandedCard } from "@meepleverse/contracts/uno-expanded";
describe("mini-game activation endings", () => {
  it.each([black("last", "wild-up"), black("last", "wild-battle"), { id: "last", kind: "high-five", color: "red", value: 5 }] satisfies UnoExpandedCard[])("wins with final $kind without creating a pending effect", card => {
    const game = fixture([[card], [num("other")]], stock(5));
    const result = act(game, "p0", { type: "PLAY_CARD", cardId: "last", ...(card.color === null ? { chosenColor: "red" as const } : {}) });
    expect(result.state.result!.winnerId).toBe("p0"); expect(result.state.effect).toBeNull(); expect(result.state.effectSequence).toBe(0);
    expect(result.state.players[1]!.hand).toHaveLength(1); expect(result.events.public.some(event => event.type === "EFFECT_STARTED")).toBe(false); conserved(game, result.state);
  });
});

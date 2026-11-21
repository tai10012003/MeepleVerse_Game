import { expandedAcceptanceFixture } from "./expanded-acceptance-fixtures.js";
import type { UnoExpandedCard as Card } from "@meepleverse/contracts/uno-expanded";
import { createExpandedGame, applyExpandedCommand, type UnoExpandedGame } from "../../src/modules/games/uno-expanded/index.js";
import { seeded } from "../unit/uno/fixtures.js";
const num = (id: string, color: "red" | "blue" | "green" | "yellow" = "red", value = 5): Card => ({ id, kind: "number", color, value });
const wild = (id: string, kind: Extract<Card, { color: null }>["kind"] = "wild"): Card => ({ id, kind, color: null });
export function expandedBrowserFixture(ids: readonly string[], scenario: string): UnoExpandedGame {
  if (scenario.startsWith("expanded-accept-")) return expandedAcceptanceFixture(ids, scenario);
  if (scenario.startsWith("expanded-full-")) return createExpandedGame(ids, seeded(Number(scenario.split("-").at(-1))));
  if (!scenario.startsWith("expanded-")) return createExpandedGame(ids, seeded(17));
  const hands: Card[][] = scenario.startsWith("expanded-effect-") ? [[{ id: "action", kind: scenario.endsWith("skip") ? "skip" : "reverse", color: "red" }, num("a-keep", "blue", 1), num("a-other", "green", 2)], [num("b-green", "green", 3), num("b-blue", "blue", 4)]] : scenario === "expanded-up" ? [[wild("up", "wild-up"), num("a-low", "blue", 1), num("a-zero", "blue", 0)],
    [{ id: "five", kind: "high-five", color: "red", value: 5 }, num("b-low", "green", 1)], [{ id: "seven", kind: "seven-change-left", color: "yellow", value: 7 }, num("c-low", "green", 1)]]
    : scenario === "expanded-battle" ? [[wild("battle", "wild-battle"), num("secret-a", "red", 9), num("reward-a", "blue", 1), num("reward-b", "blue", 2), num("keep-a", "blue", 3)],
      [num("secret-b", "red", 3), num("keep-b", "blue", 4)], [num("observer", "green", 5)]]
    : scenario === "expanded-battle-timeout" ? [[wild("battle", "wild-battle"), num("secret-a", "red", 9)], [num("secret-b", "red", 3)]]
    : scenario === "expanded-high-five" || scenario === "expanded-high-five-timeout" ? [[{ id: "five", kind: "high-five", color: "red", value: 5 }, num("a-keep", "blue", 1)],
      [num("b-one", "green", 3), num("b-two", "blue", 2)], [num("c-one", "green", 4), num("c-two", "blue", 3)], [num("d-one", "green", 5), num("d-two", "blue", 4)]]
    : scenario === "expanded-draw" ? [[num("old-red", "red", 9), num("old-blue", "blue", 3)], [num("b-green", "green", 2), num("b-yellow", "yellow", 4)]]
    : scenario === "expanded-stack" ? [[{ id: "two", kind: "draw-two", color: "red" }, { id: "two-held", kind: "draw-two", color: "yellow" }, wild("four", "wild-draw-four"), num("a-red", "red", 9)],
      [wild("shield", "wild-shield"), num("b-green", "green", 2), num("b-blue", "blue", 1)]]
    : scenario === "expanded-target" ? [[wild("target", "wild-target-four"), num("a-red", "red", 9)], [num("b-green", "green", 2), num("b-blue", "blue", 1)], [num("c-green", "green", 3), num("c-blue", "blue", 2)]]
    : scenario === "expanded-divide" ? [[wild("divide", "wild-divide-two"), num("keep-red", "red", 9), num("return-blue", "blue", 2)], [num("b-green", "green", 3), num("b-blue", "blue", 4)]]
    : [[{ id: "discard", kind: "discard-color", color: "red" }, num("a-red", "red", 9)], [num("b-green", "green", 3), num("b-blue", "blue", 4)]];
  const stock = [num("draw-red", "red", 1), ...Array.from({ length: 24 }, (_, i) => num(`stock-${i}`, "yellow", i % 10))];
  const game: UnoExpandedGame = { gameId: "uno-expanded", rulesVersion: "uno-expanded-v1", revision: 0, phase: "turn", players: ids.map((id, i) => ({ id, hand: hands[i] ?? [num(`fallback-${i}`)] })),
    dealerIndex: ids.length - 1, currentIndex: 0, direction: 1, activeColor: "red", drawPile: stock.reverse(), discardPile: [num("top", "red", 5)],
    drawnCardId: null, pendingDraw: 0, blockedTurns: 0, result: null, effectSequence: 0, effect: null };
  // Short deadlines only in trusted test fixtures; production timing and rules are unchanged.
  if (scenario === "expanded-battle-timeout") {
    const state = applyExpandedCommand(game, ids[0]!, { type: "PLAY_CARD", cardId: "battle", chosenColor: "red", targetPlayerId: ids[1]!, declareUno: true }, seeded(17)).state;
    if (state.effect?.kind === "battle") state.effect.deadline = Date.now() + 2000;
    return state;
  }
  if (scenario === "expanded-high-five-timeout") {
    const state = applyExpandedCommand(game, ids[0]!, { type: "PLAY_CARD", cardId: "five", declareUno: true }, seeded(17)).state;
    if (state.effect?.kind === "high-five") { state.effect.opensAt = Date.now() + 400; state.effect.deadline = state.effect.opensAt + 1600; }
    return state;
  }
  return game;
}

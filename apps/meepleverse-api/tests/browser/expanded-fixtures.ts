import type { UnoExpandedCard as Card } from "@meepleverse/contracts/uno-expanded";
import { createExpandedGame, type UnoExpandedGame } from "../../src/modules/games/uno-expanded/index.js";
import { seeded } from "../unit/uno/fixtures.js";
const num = (id: string, color: "red" | "blue" | "green" | "yellow" = "red", value = 5): Card => ({ id, kind: "number", color, value });
const wild = (id: string, kind: Extract<Card, { color: null }>["kind"] = "wild"): Card => ({ id, kind, color: null });
export function expandedBrowserFixture(ids: readonly string[], scenario: string): UnoExpandedGame {
  if (!scenario.startsWith("expanded-")) return createExpandedGame(ids, seeded(17));
  const hands: Card[][] = scenario === "expanded-draw" ? [[num("old-red", "red", 9), num("old-blue", "blue", 3)], [num("b-green", "green", 2), num("b-yellow", "yellow", 4)]]
    : scenario === "expanded-stack" ? [[{ id: "two", kind: "draw-two", color: "red" }, { id: "two-held", kind: "draw-two", color: "yellow" }, wild("four", "wild-draw-four"), num("a-red", "red", 9)],
      [wild("shield", "wild-shield"), num("b-green", "green", 2), num("b-blue", "blue", 1)]]
    : scenario === "expanded-target" ? [[wild("target", "wild-target-four"), num("a-red", "red", 9)], [num("b-green", "green", 2), num("b-blue", "blue", 1)], [num("c-green", "green", 3), num("c-blue", "blue", 2)]]
    : scenario === "expanded-divide" ? [[wild("divide", "wild-divide-two"), num("keep-red", "red", 9), num("return-blue", "blue", 2)], [num("b-green", "green", 3), num("b-blue", "blue", 4)]]
    : [[{ id: "discard", kind: "discard-color", color: "red" }, num("a-red", "red", 9)], [num("b-green", "green", 3), num("b-blue", "blue", 4)]];
  const stock = [num("draw-red", "red", 1), ...Array.from({ length: 24 }, (_, i) => num(`stock-${i}`, "yellow", i % 10))];
  return { gameId: "uno-expanded", rulesVersion: "uno-expanded-v1", revision: 0, phase: "turn", players: ids.map((id, i) => ({ id, hand: hands[i] ?? [num(`fallback-${i}`)] })),
    dealerIndex: ids.length - 1, currentIndex: 0, direction: 1, activeColor: "red", drawPile: stock.reverse(), discardPile: [num("top", "red", 5)],
    drawnCardId: null, pendingDraw: 0, blockedTurns: 0, result: null, effectSequence: 0, effect: null };
}

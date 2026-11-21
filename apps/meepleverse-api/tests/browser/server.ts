// Test-only entry point. Never imported by the production bootstrap.
import { createServer } from "node:http";
import { createRealtimeServer } from "../../src/bootstrap/create-realtime-server.js";
import { createGame } from "../../src/modules/games/uno/domain/rules/create-game.js";
import { fixture, seeded, number, wild, action } from "../unit/uno/fixtures.js";
import { expandedBrowserFixture } from "./expanded-fixtures.js";
let scenario = "normal";
const runtime = createRealtimeServer({ enableExpandedRooms: true, expandedGameFactory: ids => expandedBrowserFixture(ids, scenario), gameFactory: ids => {
  if (scenario === "normal") return createGame(ids, seeded(17));
  const special = scenario === "effect-four" ? wild("special", "wild-draw-four") : action("special", scenario.includes("skip") ? "skip" : scenario.includes("reverse") ? "reverse" : "draw-two", scenario.includes("green") ? "green" : "red");
  const hands = scenario === "wild" ? [[wild("plain-wild"), number("a")], [number("b", "blue", 1), number("c", "green", 2)]] : scenario === "stacking" ? [[action("two", "draw-two"), number("a")], [wild("four1", "wild-draw-four"), number("b")], [wild("four2", "wild-draw-four"), number("c")], [number("d", "blue", 1), number("e", "green", 2)]] : scenario === "stacking-two" ? [[wild("four", "wild-draw-four"), number("a")], [action("two-blue", "draw-two", "blue"), number("b")], [number("c", "green", 1), number("d", "yellow", 2)]] : scenario.startsWith("effect-") ? [[special, number("stay", "blue", 3)], [number("other-red", "red", 2), number("other-green", "green", 3)], [number("third", "green", 1)]] : scenario === "challenge"
    ? [[wild("four", "wild-draw-four"), number("secret-red")], [number("blue", "blue", 1), number("green", "green", 2)], [number("third", "yellow", 5), number("third-blue", "blue", 3)]]
    : scenario === "draw"
    ? [[number("old-red", "red", 9), number("old-blue", "blue", 5)], [number("other-green", "green", 3), number("other-yellow", "yellow", 4)]]
    : [[number("play-red", "red", 5), number("stay-blue", "blue", 3)], [number("other-red", "red", 2), number("other-green", "green", 3)]];
  const stock = scenario === "draw" ? [number("draw-blue", "blue", 1), number("draw-red", "red", 2)] : Array.from({ length: 16 }, (_, i) => number("stock-" + i, "yellow", i % 10));
  const game = fixture(ids.map((_, i) => hands[i] ?? [number("fallback-" + i)]), stock);
  if (scenario.includes("green")) { game.discardPile[0]!.color = "green"; game.activeColor = "green"; }
  if (scenario === "table") game.discardPile = [...Array.from({ length: 7 }, (_, i) => number("table-" + i, i % 2 ? "blue" : "green", i)), ...game.discardPile];
  game.players.forEach((player, i) => { player.id = ids[i]!; });
  return game;
} });
const control = createServer((req, res) => {
  const requested = req.url?.split("/").at(-1);
  if (req.method === "POST" && ["expanded-up", "expanded-battle", "expanded-battle-timeout", "expanded-high-five", "expanded-high-five-timeout", "expanded-draw", "expanded-stack", "expanded-target", "expanded-divide", "expanded-discard", "normal", "wild", "table", "stacking", "stacking-two", "challenge", "draw", "uno", "effect-skip", "effect-reverse", "effect-two", "effect-four", "effect-skip-green", "effect-reverse-green"].includes(requested ?? "")) {
    scenario = requested!;
    res.writeHead(200).end("OK");
  } else res.writeHead(404).end();
});
await new Promise<void>(resolve => control.listen(5101, "127.0.0.1", resolve));
await runtime.server.listen(5100, "127.0.0.1");
console.log("Browser test API: 5100; fixture control: 5101 (loopback only)");
let closing = false;
async function close() {
  if (closing) return; closing = true;
  control.close();
  await runtime.server.gracefullyShutdown(false);
}
for (const signal of ["SIGINT", "SIGTERM"] as const) process.once(signal, () => { void close(); });

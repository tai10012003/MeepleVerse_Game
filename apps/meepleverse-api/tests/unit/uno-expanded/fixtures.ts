import type { UnoExpandedCard as Card, UnoColor, UnoExpandedCommand } from "@meepleverse/contracts/uno-expanded";
import type { UnoExpandedGame } from "../../../src/modules/games/uno-expanded/index.js";
import { applyExpandedCommand } from "../../../src/modules/games/uno-expanded/index.js";
import { expect } from "vitest";
import { seeded } from "../uno/fixtures.js";
export const num = (id: string, color: UnoColor = "red", value = 5): Card => ({ id, kind: "number", color, value });
export const colored = (id: string, kind: "skip" | "reverse" | "draw-two" | "tornado" | "skip-two" | "discard-color", color: UnoColor = "red"): Card => ({ id, kind, color });
export const black = (id: string, kind: Extract<Card, { color: null }>["kind"] = "wild"): Card => ({ id, kind, color: null });
export const left = (id: string, color: "red" | "yellow" = "red"): Card => ({ id, kind: "seven-change-left", color, value: 7 });
export const right = (id: string, color: "green" | "blue" = "green"): Card => ({ id, kind: "seven-change-right", color, value: 7 });
export const stock = (count: number) => Array.from({ length: count }, (_, i) => num("stock-" + i, "yellow", i % 10));
export function fixture(hands: Card[][], next: Card[] = [], top: Card = num("top")): UnoExpandedGame {
  return { gameId: "uno-expanded", rulesVersion: "uno-expanded-v1", revision: 0, phase: "turn",
    players: hands.map((hand, i) => ({ id: "p" + i, hand })), dealerIndex: hands.length - 1, currentIndex: 0,
    direction: 1, activeColor: top.color ?? "red", drawPile: [...next].reverse(), discardPile: [top],
    drawnCardId: null, pendingDraw: 0, blockedTurns: 0, result: null, effectSequence: 0, effect: null };
}
export function step(game: UnoExpandedGame, command: UnoExpandedCommand) {
  return applyExpandedCommand(game, game.players[game.currentIndex]!.id, command, seeded(21));
}
export function play(game: UnoExpandedGame, id: string, options: Partial<Extract<UnoExpandedCommand, { type: "PLAY_CARD" }>> = {}) {
  return step(game, { type: "PLAY_CARD", cardId: id, ...options });
}
export function conserved(before: UnoExpandedGame, after: UnoExpandedGame) {
  const cards = (game: UnoExpandedGame) => [...game.drawPile, ...game.discardPile, ...game.players.flatMap(player => player.hand)].map(card => card.id).sort();
  expect(cards(after)).toEqual(cards(before)); expect(new Set(cards(after)).size).toBe(cards(after).length);
}

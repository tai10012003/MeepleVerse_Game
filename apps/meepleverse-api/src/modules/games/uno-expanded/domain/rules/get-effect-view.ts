import type { UnoExpandedEffectView, UnoExpandedOwnBattle } from "@meepleverse/contracts/uno-expanded";
import type { UnoExpandedGame } from "../models/uno-expanded-game.js";
import { battleEligibleCards } from "./wild-battle.js";
export function actingExpandedPlayerId(game: UnoExpandedGame): string | null {
  if (["ended", "battle-select", "high-five"].includes(game.phase)) return null;
  return game.players[game.currentIndex]!.id;
}
export function expandedEffectView(game: UnoExpandedGame): UnoExpandedEffectView | null {
  const effect = game.effect;
  if (!effect) return null;
  switch (effect.kind) {
    case "up": return { kind: "up", id: effect.id, actorId: effect.actorId, openingColor: effect.openingColor, lastValue: effect.lastValue };
    case "high-five": return { kind: effect.kind, id: effect.id, actorId: effect.actorId, stage: effect.stage, attempt: effect.attempt,
      opensAt: effect.opensAt, deadline: effect.deadline, remainingMs: effect.remainingMs, eligiblePlayerIds: effect.eligiblePlayerIds, responseOrder: effect.responseOrder };
    case "battle": return { kind: effect.kind, id: effect.id, actorId: effect.actorId, targetId: effect.targetId, color: effect.color, stage: effect.stage,
      deadline: effect.deadline, remainingMs: effect.remainingMs, lockedPlayerIds: [effect.actorId, effect.targetId].filter(id => !effect.eligiblePlayerIds.includes(id) || effect.choices.some(choice => choice.playerId === id)),
      winnerId: effect.winnerId, revealed: effect.revealed };
  }
}
export function ownBattleView(game: UnoExpandedGame, playerId: string): UnoExpandedOwnBattle | null {
  const effect = game.effect;
  if (effect?.kind !== "battle" || ![effect.actorId, effect.targetId].includes(playerId)) return null;
  const choice = effect.choices.find(choice => choice.playerId === playerId);
  return { eligibleCardIds: effect.stage === "select" && !choice ? battleEligibleCards(game, playerId, effect).map(card => card.id) : [],
    selectedCardId: choice?.cardId ?? null, selectedDeclareUno: choice?.declareUno ?? null,
    rewardCount: effect.stage === "reward" && effect.winnerId === playerId ? effect.rewardCount : 0 };
}

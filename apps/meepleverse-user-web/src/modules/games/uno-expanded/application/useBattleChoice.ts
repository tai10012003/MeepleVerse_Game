"use client";
import { useState } from "react";
import type { UnoExpandedCommand, UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
interface Draft { scope: string; ids: string[]; uno: boolean }
export function useBattleChoice(view: UnoExpandedRoomView, connected: boolean, pending: boolean, epoch: number, onCommand: (command: UnoExpandedCommand) => void) {
  const effect = view.game?.effect?.kind === "battle" ? view.game.effect : null;
  const own = view.game?.self.battle;
  // Other players may lock at any global revision. Their response must not erase this local draft.
  const scope = `${view.matchId}:${effect?.id}:${effect?.stage}:${epoch}`;
  const [draft, setDraft] = useState<Draft | null>(null);
  const current = draft?.scope === scope ? draft : { scope, ids: [], uno: false };
  const reward = effect?.stage === "reward";
  const required = reward ? own?.rewardCount ?? 0 : 1;
  const cards = view.game?.self.hand.filter(card => reward ? effect?.winnerId === view.selfPlayerId : own?.eligibleCardIds.includes(card.id)) ?? [];
  const locked = !!effect && !reward && !!own?.selectedCardId;
  const active = !!effect && connected && !pending && !view.paused && view.status === "PLAYING" && !locked &&
    (reward ? effect.winnerId === view.selfPlayerId && required > 0 : cards.length > 0);
  const needsUno = !!view.game && view.game.self.hand.length >= 2 && view.game.self.hand.length - required === 1;
  const armed = locked ? own?.selectedDeclareUno === true : current.uno;
  function toggle(id: string) {
    if (!active || !cards.some(card => card.id === id)) return;
    const ids = !reward ? [id] : current.ids.includes(id) ? current.ids.filter(value => value !== id) : current.ids.length < required ? [...current.ids, id] : current.ids;
    setDraft({ ...current, ids });
  }
  function submit() {
    if (!active || !effect || current.ids.length !== required || !current.ids.every(id => cards.some(card => card.id === id))) return;
    const declareUno = needsUno && armed;
    onCommand(reward ? { type: "BATTLE_DISCARD", effectId: effect.id, cardIds: current.ids, declareUno }
      : { type: "BATTLE_SELECT", effectId: effect.id, cardId: current.ids[0]!, declareUno });
  }
  return { effect, own, cards, required, active, locked, needsUno, armed, selectedIds: current.ids,
    canArm: active && needsUno, ready: active && current.ids.length === required, toggle, submit,
    toggleUno: () => { if (active && needsUno) setDraft({ ...current, uno: !current.uno }); } };
}
export type BattleChoice = ReturnType<typeof useBattleChoice>;

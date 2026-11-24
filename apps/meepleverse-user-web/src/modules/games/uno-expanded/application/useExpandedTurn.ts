"use client";
import { useState } from "react";
import type { UnoColor, UnoExpandedCommand, UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import { remainingAfterPlay } from "../model/turn-presentation";
interface Choice { scope: string; cardId: string; editing: boolean; color?: UnoColor; target?: string; ids: string[] }
export function useExpandedTurn(view: UnoExpandedRoomView, connected: boolean, pending: boolean, onCommand: (command: UnoExpandedCommand) => void) {
  const game = view.game;
  const scope = `${view.matchId}:${game?.revision}:${view.revision}:${connected}`;
  const [choice, setChoice] = useState<Choice | null>(null);
  const [unoScope, setUnoScope] = useState<string | null>(null);
  const active = connected && !pending && !view.paused && view.status === "PLAYING" && !!game &&
    game.currentPlayerId === view.selfPlayerId && ["turn", "drawn", "draw-stack", "up"].includes(game.phase);
  const draft = choice?.scope === scope ? choice : null;
  const selected = game && draft ? game.self.hand.find(card => card.id === draft.cardId && game.self.playableCardIds.includes(card.id)) : undefined;
  const swap = selected?.kind === "wild-card-swap";
  const needsTarget = selected?.kind === "wild-target-four" || ((selected?.kind === "wild-battle" || swap) && game!.self.hand.length > 1);
  const target = game?.players.find(player => player.playerId === draft?.target && player.playerId !== view.selfPlayerId);
  const remaining = swap && game!.self.hand.length > 1 ? target?.handCount ?? null : game && selected ? remainingAfterPlay(game.self.hand, selected, draft?.color) : null;
  const needsUno = !swap && !!game && game.self.hand.length >= 2 && remaining === 1;
  const armed = unoScope === scope;
  const canArm = active && !swap && (!!game && game.self.hand.length === 2 || needsUno);
  const required = selected?.kind === "wild-divide-two" ? Math.floor((game!.self.hand.length - 1) / 2) : 0;
  const validOptions = !!selected && !!draft && (selected.color !== null || !!draft.color) &&
    (!needsTarget || !!target) &&
    (selected.kind !== "wild-divide-two" || draft.ids.length === required);
  function update(value: Partial<Pick<Choice, "editing" | "color" | "target" | "ids">>) {
    if (draft && active) setChoice({ ...draft, ...value });
  }
  function submit() {
    if (!active || !selected || !validOptions || !draft) return;
    if (game?.effect?.kind === "up") {
      onCommand({ type: "UP_PLAY", effectId: game.effect.id, cardId: selected.id, declareUno: needsUno && armed }); return;
    }
    onCommand({ type: "PLAY_CARD", cardId: selected.id, declareUno: needsUno && armed,
      ...(selected.color === null ? { chosenColor: draft.color! } : {}),
      ...(needsTarget ? { targetPlayerId: draft.target! } : {}),
      ...(selected.kind === "wild-divide-two" ? { discardCardIds: draft.ids } : {}) });
  }
  function play() {
    if (!active || !selected || !draft) return;
    if (selected.color === null || selected.kind === "discard-color" && needsUno) update({ editing: true }); else submit();
  }
  return { active, selected, draft, remaining, needsUno, armed, canArm, required, validOptions, needsTarget,
    dialogOpen: !!selected && !!draft?.editing && connected && !view.paused,
    select: (cardId: string) => { if (active && game?.self.playableCardIds.includes(cardId)) setChoice({ scope, cardId, editing: false, ids: [] }); },
    toggleUno: () => { if (canArm) setUnoScope(armed ? null : scope); },
    update, submit, play, cancel: () => update({ editing: false }),
  };
}
export type ExpandedTurn = ReturnType<typeof useExpandedTurn>;

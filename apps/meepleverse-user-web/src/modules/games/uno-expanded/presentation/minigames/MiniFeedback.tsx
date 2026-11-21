"use client";
import { useEffect, useState } from "react";
import type { UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import { miniDrawTotals, type MiniFeedbackFrame } from "../../model/mini-feedback";
import { ExpandedCardFace } from "../cards";
export function MiniFeedback({ view, frames }: { view: UnoExpandedRoomView; frames: MiniFeedbackFrame[] }) {
  const frame = frames.filter(frame => frame.matchId === view.matchId).at(-1); const event = frame?.events.at(-1);
  const [dismissed, setDismissed] = useState<string | null>(null);
  useEffect(() => { if (!frame) return; const timer = setTimeout(() => setDismissed(frame.id), 3500); return () => clearTimeout(timer); }, [frame]);
  if (!frame || !event || dismissed === frame.id || view.paused || view.game?.effect) return null;
  const name = (id: string) => view.members.find(member => member.playerId === id)?.nickname ?? "Người chơi";
  const reveal = frames.filter(frame => frame.matchId === view.matchId).flatMap(frame => frame.events).findLast(item => item.type === "BATTLE_REVEALED" && "effectId" in event && item.effectId === event.effectId);
  const battle = reveal?.type === "BATTLE_REVEALED" ? reveal : event.type === "BATTLE_REVEALED" ? event : null;
  const winnerId = battle?.winnerId ?? (event.type === "BATTLE_RESOLVED" ? event.winnerId : null);
  const label = event.type === "HIGH_FIVE_RESOLVED" ? "Đập tay · " + frame.events.filter(item => item.type === "HIGH_FIVE_RESOLVED" && item.effectId === event.effectId).map(item => item.type === "HIGH_FIVE_RESOLVED" ? `${name(item.playerId)} bốc ${item.count} lá` : "").join(" · ") : event.type === "UP_ENDED" ? `${name(event.playerId)} bốc ${event.count} lá · Kết thúc Up.`
    : winnerId ? `${name(winnerId)} thắng Battle.` : battle?.cards.length === 2 ? "Battle hòa." : "Battle đã kết thúc.";
  return <section className="mini-panel mini-feedback" data-testid="mini-feedback" aria-label="Kết quả thử thách"><h2 role="status">{label}</h2>
    {(event.type === "BATTLE_RESOLVED" || event.type === "BATTLE_REVEALED") && <p>{miniDrawTotals(frames, view.matchId, event.effectId).map(draw => `${name(draw.playerId)} bốc ${draw.count} lá`).join(" · ")}</p>}
    {battle && <div className="battle-revealed">{battle.cards.map(entry => <figure key={entry.playerId}><ExpandedCardFace card={entry.card} /><figcaption>{name(entry.playerId)}</figcaption></figure>)}</div>}
    <button type="button" className="text-button" onClick={() => setDismissed(frame.id)}>Tiếp tục</button>
  </section>;
}

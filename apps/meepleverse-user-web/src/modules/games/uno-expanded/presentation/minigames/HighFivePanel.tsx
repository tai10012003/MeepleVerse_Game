"use client";
import { useEffect, useRef } from "react";
import type { UnoExpandedCommand, UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import { playSound } from "@/shared/audio/audio";
import { EffectCountdown } from "./EffectCountdown";
type Props = { view: UnoExpandedRoomView; connected: boolean; pending: boolean; onCommand: (command: UnoExpandedCommand) => void };
export function HighFiveButton({ view, connected, pending, onCommand }: Props) {
  const effect = view.game?.effect;
  const highFive = effect?.kind === "high-five" ? effect : null;
  const rank = highFive ? highFive.responseOrder.indexOf(view.selfPlayerId) + 1 : 0;
  const active = !!highFive && connected && !pending && !view.paused && highFive.stage === "active" && highFive.eligiblePlayerIds.includes(view.selfPlayerId) && rank === 0;
  const sounded = useRef<string | null>(null);
  useEffect(() => {
    if (!highFive || highFive.stage !== "active" || !connected || view.paused) return;
    const key = `${highFive.id}:${highFive.attempt}`;
    if (sounded.current !== key) { sounded.current = key; playSound("turn"); }
  }, [highFive, connected, view.paused]);
  return <button type="button" className={`expanded-high-five${active ? " is-active" : ""}${rank > 0 ? " has-responded" : ""}`} aria-label="Đập tay!" disabled={!active}
    onClick={() => highFive && onCommand({ type: "HIGH_FIVE", effectId: highFive.id, attempt: highFive.attempt })}>
    <strong aria-hidden="true">✋</strong><small>{rank > 0 ? "Đã đập tay" : "Đập tay"}</small>
    {highFive && rank === 0 && <EffectCountdown key={`${highFive.id}:${highFive.attempt}:${highFive.stage}`} deadline={highFive.stage === "preparing" ? highFive.opensAt : highFive.deadline} remainingMs={highFive.remainingMs} paused={view.paused || !connected} />}
  </button>;
}
export function HighFivePanel({ view, connected }: Pick<Props, "view" | "connected">) {
  const effect = view.game?.effect; if (effect?.kind !== "high-five") return null;
  const rank = effect.responseOrder.indexOf(view.selfPlayerId) + 1;
  return <section className="high-five-notice" data-testid="high-five-panel" data-stage={effect.stage} data-attempt={effect.attempt} aria-label="Đập tay">
    <h2>{view.paused || !connected ? "Tạm dừng Đập tay" : effect.stage === "preparing" ? "Sẵn sàng đập tay!" : "Đập tay trong 5 giây!"}</h2>
    <p>{rank > 0 ? `Đã ghi nhận · thứ tự ${rank}.` : "Tất cả cùng bấm ✋ cạnh UNO. Ai không bấm nhận +2; nếu đủ người bấm, người cuối nhận +2."}</p>
    <ol className="high-five-order" aria-label="Thứ tự đập tay">{effect.responseOrder.map(id => <li key={id}>{view.members.find(member => member.playerId === id)?.nickname ?? "Người chơi"}</li>)}</ol>
  </section>;
}

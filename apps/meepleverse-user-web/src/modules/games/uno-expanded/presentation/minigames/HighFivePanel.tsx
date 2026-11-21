import type { UnoExpandedCommand, UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import { EffectCountdown } from "./EffectCountdown";
export function HighFivePanel({ view, connected, pending, onCommand }: { view: UnoExpandedRoomView; connected: boolean; pending: boolean; onCommand: (command: UnoExpandedCommand) => void }) {
  const effect = view.game!.effect; if (effect?.kind !== "high-five") return null;
  const eligible = effect.eligiblePlayerIds.includes(view.selfPlayerId); const rank = effect.responseOrder.indexOf(view.selfPlayerId) + 1;
  const active = connected && !pending && !view.paused && effect.stage === "active" && eligible && rank === 0;
  return <section className="mini-panel high-five-panel" data-testid="high-five-panel" data-stage={effect.stage} data-attempt={effect.attempt} aria-label="Đập tay">
    <header><div><span className="eyebrow">High Five</span><h2>{effect.stage === "preparing" ? "Sẵn sàng đập tay!" : "Đập tay!"}</h2></div><EffectCountdown deadline={effect.stage === "preparing" ? effect.opensAt : effect.deadline} remainingMs={effect.remainingMs} paused={view.paused || !connected} /></header>
    <p>{!eligible ? "Bạn đã đánh lá này nên được miễn." : rank > 0 ? `Đã ghi nhận · thứ tự ${rank}.` : effect.stage === "preparing" ? "Chờ hiệu lệnh rồi bấm nút bên dưới." : "Bấm ngay! Người chậm nhất phải bốc 2 lá."}</p>
    <button type="button" className="high-five-button" disabled={!active} onClick={() => onCommand({ type: "HIGH_FIVE", effectId: effect.id, attempt: effect.attempt })}>Đập tay!</button>
    <ol className="high-five-order" aria-label="Thứ tự đập tay">{effect.responseOrder.map(id => <li key={id}>{view.members.find(member => member.playerId === id)?.nickname ?? "Người chơi"}</li>)}</ol>
    <small>Thứ tự do server ghi nhận. Mất kết nối sẽ tạm dừng thử thách.</small>
  </section>;
}

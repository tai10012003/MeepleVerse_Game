import { miniDrawTotals, type MiniFeedbackFrame } from "../../model/mini-feedback";
import type { UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import type { BattleChoice } from "../../application/useBattleChoice";
import { colorNames } from "../../../uno-common";
import { ExpandedCardFace } from "../cards";
import { CardChoiceGrid } from "../components/CardChoiceGrid";
import { EffectCountdown } from "./EffectCountdown";
export function BattlePanel({ view, choice, connected, feedback }: { view: UnoExpandedRoomView; choice: BattleChoice; connected: boolean; feedback: MiniFeedbackFrame[] }) {
  const effect = choice.effect!; const nameOf = (id: string) => view.members.find(member => member.playerId === id)?.nickname ?? "Người chơi";
  const lockedCard = view.game!.self.hand.find(card => card.id === choice.own?.selectedCardId);
  return <section className="mini-panel battle-panel" data-testid="battle-panel" data-stage={effect.stage} aria-label="Wild Battle">
    <header><div><span className="eyebrow">Hai kiếm · {colorNames[effect.color]}</span><h2>{nameOf(effect.actorId)} <span aria-hidden="true">⚔</span> {nameOf(effect.targetId)}</h2></div><EffectCountdown deadline={effect.deadline} remainingMs={effect.remainingMs} paused={view.paused || !connected} /></header>
    {effect.stage === "select" ? <>
      <div className="battle-readiness">{[effect.actorId, effect.targetId].map(id => <span key={id}>{nameOf(id)} · {effect.lockedPlayerIds.includes(id) ? "Sẵn sàng" : "Đang chọn"}</span>)}</div>
      {choice.locked ? <div className="battle-locked"><div>{lockedCard && <ExpandedCardFace card={lockedCard} />}</div><p>Đã khóa bài của bạn. Đối thủ chưa thấy mặt bài.</p></div>
        : choice.cards.length ? <><p>Chọn một lá số cùng màu. Bài chỉ lật khi hai bên sẵn sàng.</p><CardChoiceGrid cards={choice.cards} selectedIds={choice.selectedIds} limit={1} replace disabled={!choice.active} onToggle={choice.toggle} /></>
        : <p>{choice.own ? "Bạn không có lá số phù hợp. Server sẽ giải quyết khi đối thủ sẵn sàng." : "Hai người đang chọn bài bí mật."}</p>}
    </> : <>
      <div className="battle-revealed">{effect.revealed.map(entry => <figure key={entry.playerId}><ExpandedCardFace card={entry.card} /><figcaption>{nameOf(entry.playerId)}</figcaption></figure>)}</div>
      <p className="battle-penalties">{miniDrawTotals(feedback, view.matchId, effect.id).map(draw => `${nameOf(draw.playerId)} bốc ${draw.count} lá`).join(" · ")}</p>
      <p>{effect.winnerId ? `${nameOf(effect.winnerId)} thắng Battle.` : "Battle hòa."}</p>
      {choice.own?.rewardCount ? <><h3>Chọn {choice.required} lá thưởng để bỏ</h3><CardChoiceGrid cards={choice.cards} selectedIds={choice.selectedIds} limit={choice.required} disabled={!choice.active} onToggle={choice.toggle} /></> : <p>Chờ người thắng chọn bài thưởng.</p>}
    </>}
    {choice.canArm && <p className="mini-uno-note">{choice.armed ? "Đã hô UNO cho lựa chọn này." : "Còn một lá sau lựa chọn: bấm nút UNO phía dưới trước khi xác nhận."}</p>}
    {choice.active && <div className="mini-actions"><span>{choice.selectedIds.length}/{choice.required} lá</span><button type="button" className="button primary" disabled={!choice.ready} onClick={choice.submit}>{effect.stage === "select" ? "Khóa lá bài" : "Xác nhận bỏ bài thưởng"}</button></div>}
    <small>Hết giờ, server chọn bài hợp lệ giúp lượt chơi tiếp tục; không tự hô UNO.</small>
  </section>;
}

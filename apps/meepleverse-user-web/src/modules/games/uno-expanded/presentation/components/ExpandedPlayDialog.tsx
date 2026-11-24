"use client";
import { UnoChoicePrompt } from "./UnoChoicePrompt";
import { useEffect, useId, useRef } from "react";
import type { UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import { ColorChoices } from "../../../uno-common/presentation/components/ColorChoices";
import { colorNames } from "../../../uno-common";
import type { ExpandedTurn } from "../../application/useExpandedTurn";
import { expandedCardName } from "../cards";
import { CardChoiceGrid } from "./CardChoiceGrid";
export function ExpandedPlayDialog({ view, turn }: { view: UnoExpandedRoomView; turn: ExpandedTurn }) {
  const dialog = useRef<HTMLDialogElement>(null); const titleId = useId();
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
  const card = turn.selected!; const choice = turn.draft!; const game = view.game!;
  const swap = card.kind === "wild-card-swap";
  const targetChoice = turn.needsTarget && <section aria-label={swap ? "Chọn người đổi bài" : card.kind === "wild-battle" ? "Chọn đối thủ" : "Chọn người nhận"}>
    <h3>{swap ? "Bạn muốn đổi bài với ai?" : card.kind === "wild-battle" ? "Bạn muốn đấu với ai?" : "Ai nhận +4?"}</h3>
    <div className="expanded-targets">{view.members.filter(member => member.playerId !== view.selfPlayerId && game.players.some(player => player.playerId === member.playerId)).map(member => <button type="button" key={member.playerId} aria-pressed={choice.target === member.playerId} disabled={!turn.active} onClick={() => turn.update({ target: member.playerId })}>
      {member.nickname}{swap && <small>{game.players.find(player => player.playerId === member.playerId)!.handCount} lá</small>}
    </button>)}</div>
  </section>;
  return <dialog ref={dialog} className="leave-dialog expanded-choice" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (turn.active) turn.cancel(); }}>
    <div className="expanded-choice-heading"><span className="eyebrow">Chuẩn bị nước đánh</span><h2 id={titleId}>{expandedCardName(card)}</h2><p>Chỉ đánh xuống khi bạn xác nhận đầy đủ lựa chọn.</p></div>
    {swap && <p className="form-note">{game.self.hand.length === 1 ? "Đây là lá cuối: bạn thắng ngay, không đổi tay bài." : `Sau khi đánh lá này, bạn giao ${game.self.hand.length - 1} lá còn lại và nhận toàn bộ tay bài của người được chọn. Nhận tay một lá không bị phạt UNO.`}</p>}
    {swap && targetChoice}
    {card.color === null && <section aria-label="Chọn màu"><h3>Chọn màu tiếp theo</h3><ColorChoices disabled={!turn.active} value={choice.color} onChoose={color => turn.update({ color })} />{choice.color && <p className="form-note">Đã chọn {colorNames[choice.color]}.</p>}</section>}
    {!swap && targetChoice}
    {card.kind === "wild-divide-two" && <section aria-label="Chọn bài chia hai"><h3>Chọn {turn.required} lá để bỏ</h3><p className="form-note" role="status">Đã chọn {choice.ids.length}/{turn.required}. Những lá này được đưa xuống đáy chồng bốc.</p><CardChoiceGrid cards={game.self.hand.filter(held => held.id !== card.id)} selectedIds={choice.ids} limit={turn.required} disabled={!turn.active} onToggle={id => turn.update({ ids: choice.ids.includes(id) ? choice.ids.filter(value => value !== id) : [...choice.ids, id] })} /></section>}
    {turn.remaining !== null && !turn.needsUno && <p className="expanded-reduction">Sau nước đánh: còn <strong>{turn.remaining} lá</strong>.</p>}
    {turn.needsUno && <UnoChoicePrompt remaining={1} armed={turn.armed} disabled={!turn.active} onToggle={turn.toggleUno} />}
    <div className="dialog-actions"><button type="button" className="button secondary" disabled={!turn.active} onClick={turn.cancel}>Chọn lá khác</button><button type="button" className="button primary" disabled={!turn.active || !turn.validOptions} onClick={turn.submit}>Xác nhận</button></div>
  </dialog>;
}

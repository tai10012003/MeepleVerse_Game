"use client";
import { useEffect, useId, useRef } from "react";
import type { UnoExpandedRoomView } from "@meepleverse/contracts/uno-expanded";
import { ColorChoices } from "../../../uno-common/presentation/components/ColorChoices";
import { colorNames } from "../../../uno-common";
import type { ExpandedTurn } from "../../application/useExpandedTurn";
import { ExpandedCardFace, expandedCardName } from "../cards";
export function ExpandedPlayDialog({ view, turn }: { view: UnoExpandedRoomView; turn: ExpandedTurn }) {
  const dialog = useRef<HTMLDialogElement>(null); const titleId = useId();
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
  const card = turn.selected!; const choice = turn.draft!; const game = view.game!;
  return <dialog ref={dialog} className="leave-dialog expanded-choice" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (turn.active) turn.cancel(); }}>
    <div className="expanded-choice-heading"><span className="eyebrow">Chuẩn bị nước đánh</span><h2 id={titleId}>{expandedCardName(card)}</h2><p>Chỉ đánh xuống khi bạn xác nhận đầy đủ lựa chọn.</p></div>
    {card.color === null && <section aria-label="Chọn màu"><h3>Chọn màu tiếp theo</h3><ColorChoices disabled={!turn.active} value={choice.color} onChoose={color => turn.update({ color })} />{choice.color && <p className="form-note">Đã chọn {colorNames[choice.color]}.</p>}</section>}
    {card.kind === "wild-target-four" && <section aria-label="Chọn người nhận"><h3>Ai nhận +4?</h3><div className="expanded-targets">{view.members.filter(member => member.playerId !== view.selfPlayerId).map(member => <button type="button" key={member.playerId} aria-pressed={choice.target === member.playerId} disabled={!turn.active} onClick={() => turn.update({ target: member.playerId })}>{member.nickname}</button>)}</div></section>}
    {card.kind === "wild-divide-two" && <section aria-label="Chọn bài chia hai"><h3>Chọn {turn.required} lá để bỏ</h3><p className="form-note" role="status">Đã chọn {choice.ids.length}/{turn.required}. Những lá này được đưa xuống đáy chồng bốc.</p><div className="expanded-choice-hand">{game.self.hand.filter(held => held.id !== card.id).map(held => {
      const selected = choice.ids.includes(held.id); return <button type="button" key={held.id} aria-label={expandedCardName(held)} aria-pressed={selected} data-choice-card-id={held.id}
        disabled={!turn.active || !selected && choice.ids.length >= turn.required} onClick={() => turn.update({ ids: selected ? choice.ids.filter(id => id !== held.id) : [...choice.ids, held.id] })}><ExpandedCardFace card={held} decorative /></button>;
    })}</div></section>}
    {turn.remaining !== null && <p className="expanded-reduction">Sau nước đánh: còn <strong>{turn.remaining} lá</strong>.</p>}
    {turn.needsUno && <div className="expanded-choice-uno"><button type="button" className={turn.armed ? "is-armed" : ""} aria-pressed={turn.armed} disabled={!turn.active} onClick={turn.toggleUno}>Hô UNO{turn.armed ? " · Đã hô" : ""}</button><p>Chưa hô UNO thì server tự phạt bốc 2 lá.</p></div>}
    <div className="dialog-actions"><button type="button" className="button secondary" disabled={!turn.active} onClick={turn.cancel}>Chọn lá khác</button><button type="button" className="button primary" disabled={!turn.active || !turn.validOptions} onClick={turn.submit}>Xác nhận đánh bài</button></div>
  </dialog>;
}

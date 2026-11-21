"use client";
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
  return <dialog ref={dialog} className="leave-dialog expanded-choice" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (turn.active) turn.cancel(); }}>
    <div className="expanded-choice-heading"><span className="eyebrow">Chuẩn bị nước đánh</span><h2 id={titleId}>{expandedCardName(card)}</h2><p>Chỉ đánh xuống khi bạn xác nhận đầy đủ lựa chọn.</p></div>
    {card.color === null && <section aria-label="Chọn màu"><h3>Chọn màu tiếp theo</h3><ColorChoices disabled={!turn.active} value={choice.color} onChoose={color => turn.update({ color })} />{choice.color && <p className="form-note">Đã chọn {colorNames[choice.color]}.</p>}</section>}
    {(card.kind === "wild-target-four" || card.kind === "wild-battle" && game.self.hand.length > 1) && <section aria-label={card.kind === "wild-battle" ? "Chọn đối thủ" : "Chọn người nhận"}><h3>{card.kind === "wild-battle" ? "Bạn muốn đấu với ai?" : "Ai nhận +4?"}</h3><div className="expanded-targets">{view.members.filter(member => member.playerId !== view.selfPlayerId).map(member => <button type="button" key={member.playerId} aria-pressed={choice.target === member.playerId} disabled={!turn.active} onClick={() => turn.update({ target: member.playerId })}>{member.nickname}</button>)}</div></section>}
    {card.kind === "wild-divide-two" && <section aria-label="Chọn bài chia hai"><h3>Chọn {turn.required} lá để bỏ</h3><p className="form-note" role="status">Đã chọn {choice.ids.length}/{turn.required}. Những lá này được đưa xuống đáy chồng bốc.</p><CardChoiceGrid cards={game.self.hand.filter(held => held.id !== card.id)} selectedIds={choice.ids} limit={turn.required} disabled={!turn.active} onToggle={id => turn.update({ ids: choice.ids.includes(id) ? choice.ids.filter(value => value !== id) : [...choice.ids, id] })} /></section>}
    {turn.remaining !== null && <p className="expanded-reduction">Sau nước đánh: còn <strong>{turn.remaining} lá</strong>.</p>}
    {turn.needsUno && <div className="expanded-choice-uno"><button type="button" className={turn.armed ? "is-armed" : ""} aria-pressed={turn.armed} disabled={!turn.active} onClick={turn.toggleUno}>Hô UNO{turn.armed ? " · Đã hô" : ""}</button><p>Chưa hô UNO thì server tự phạt bốc 2 lá.</p></div>}
    <div className="dialog-actions"><button type="button" className="button secondary" disabled={!turn.active} onClick={turn.cancel}>Chọn lá khác</button><button type="button" className="button primary" disabled={!turn.active || !turn.validOptions} onClick={turn.submit}>Xác nhận đánh bài</button></div>
  </dialog>;
}

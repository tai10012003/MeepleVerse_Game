"use client";
import "../uno-primitives.css";
import { useEffect, useId, useRef, useState } from "react";
import { colorNames } from "../../model/color-names";
import { ColorChoices } from "./ColorChoices";
import type { UnoColor } from "@meepleverse/contracts/uno-common";
export function ColorPicker({ disabled, onChoose, onCancel }: { disabled: boolean; onChoose: (color: UnoColor) => void; onCancel?: () => void }) {
  const titleId = useId();
  const [color, setColor] = useState<UnoColor>();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="leave-dialog color-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!disabled) onCancel?.(); }}>
    <span className="eyebrow">Bạn chọn màu tiếp theo</span><h2 id={titleId}>Đổi sang màu nào?</h2>
    <ColorChoices disabled={disabled} value={color} onChoose={setColor} />
    <p className="form-note" role="status">{color ? `Đã chọn ${colorNames[color]}.` : "Chọn một màu rồi xác nhận."}</p>
    <div className="dialog-actions">
      {onCancel && <button type="button" className="button secondary" disabled={disabled} onClick={onCancel}>Chọn lá khác</button>}
      <button type="button" className="button primary" disabled={disabled || !color} onClick={() => { if (color && !disabled) onChoose(color); }}>Xác nhận</button>
    </div>
  </dialog>;
}

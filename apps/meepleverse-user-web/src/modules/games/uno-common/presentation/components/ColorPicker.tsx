"use client";
import "../uno-primitives.css";
import { useEffect, useId, useRef } from "react";
import { ColorChoices } from "./ColorChoices";
import type { UnoColor } from "@meepleverse/contracts/uno-common";
export function ColorPicker({ disabled, onChoose, onCancel }: { disabled: boolean; onChoose: (color: UnoColor) => void; onCancel?: () => void }) {
  const titleId = useId();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="leave-dialog color-dialog" aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onCancel?.(); }}>
    <span className="eyebrow">Bạn chọn màu tiếp theo</span><h2 id={titleId}>Đổi sang màu nào?</h2>
    <ColorChoices disabled={disabled} onChoose={onChoose} />
    {onCancel && <button className="text-button" disabled={disabled} onClick={onCancel}>Chọn lá khác</button>}
  </dialog>;
}

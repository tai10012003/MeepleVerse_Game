"use client";
import { useEffect, useRef } from "react";
import type { UnoColor } from "@meepleverse/contracts/uno";
import { colorNames } from "../../model/uno-view-state";
export function ColorPicker({ disabled, onChoose, onCancel }: { disabled: boolean; onChoose: (color: UnoColor) => void; onCancel?: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="leave-dialog color-dialog" aria-labelledby="color-title" onCancel={event => { event.preventDefault(); onCancel?.(); }}>
    <span className="eyebrow">Bạn chọn màu tiếp theo</span><h2 id="color-title">Đổi sang màu nào?</h2>
    <div className="color-choices">{(["red", "yellow", "green", "blue"] as const).map(color => <button type="button" key={color} className={"color-choice color-" + color} disabled={disabled} onClick={() => onChoose(color)}>{colorNames[color]}</button>)}</div>
    {onCancel && <button className="text-button" disabled={disabled} onClick={onCancel}>Chọn lá khác</button>}
  </dialog>;
}

"use client";
import { useEffect, useRef } from "react";
export function LeaveDialog({ playing, onCancel, onLeave }: { playing: boolean; onCancel: () => void; onLeave: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return <dialog ref={ref} className="leave-dialog" aria-labelledby="leave-title" onCancel={event => { event.preventDefault(); onCancel(); }}>
    <h2 id="leave-title">Rời phòng này?</h2><p>{playing ? "Rời phòng sẽ kết thúc ván hiện tại của nhóm." : "Bạn sẽ trả lại chỗ ngồi. Nhóm vẫn có thể tiếp tục chờ."}</p>
    <div className="dialog-actions"><button autoFocus className="button secondary" onClick={onCancel}>Ở lại</button><button className="button primary" onClick={onLeave}>Xác nhận rời phòng</button></div>
  </dialog>;
}

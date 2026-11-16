"use client";
import { useId, useRef } from "react";
import { UnoRulesContent } from "./UnoRulesContent";
import "./uno-rules.css";
export function UnoRulesButton({ compact = false }: { compact?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const title = useId();
  return <><button type="button" ref={trigger} className={"uno-rules-trigger" + (compact ? " is-compact" : "")} aria-label="Luật chơi UNO Cơ bản" aria-haspopup="dialog" title="Luật chơi UNO Cơ bản" onClick={() => { dialog.current?.showModal(); body.current?.scrollTo(0, 0); }}><span aria-hidden="true">?</span>{!compact && <span>Luật chơi</span>}</button>
    <dialog ref={dialog} className="uno-rules-dialog" aria-labelledby={title} onClose={() => trigger.current?.focus()} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
      <header className="uno-rules-header"><div><span className="uno-rules-kicker">HƯỚNG DẪN CHƠI · MEEPLEVERSE</span><h2 id={title}>Luật chơi UNO Cơ bản</h2></div><button type="button" autoFocus aria-label="Đóng hướng dẫn luật chơi" onClick={() => dialog.current?.close()}>×</button></header>
      <div ref={body} className="uno-rules-body" tabIndex={0} aria-label="Nội dung hướng dẫn luật chơi"><UnoRulesContent /></div>
      <footer className="uno-rules-footer"><span>Nhớ hô UNO trước khi còn 1 lá!</span><button type="button" className="button primary" onClick={() => dialog.current?.close()}>Đã hiểu, vào bàn thôi</button></footer>
    </dialog>
  </>;
}

"use client";
import { useId, useRef } from "react";
import type { ReactNode } from "react";
import "./game-rules.css";
export function GameRulesButton({ compact = false, label, children, className = "", footer = "Nhớ hô UNO trước khi còn 1 lá!" }: {
  compact?: boolean; label: string; children: ReactNode; className?: string; footer?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const title = useId();
  return <><button type="button" ref={trigger} className={"uno-rules-trigger" + (compact ? " is-compact" : "")} aria-label={label} aria-haspopup="dialog" title={label} onClick={() => { dialog.current?.showModal(); body.current?.scrollTo(0, 0); }}><span aria-hidden="true">?</span>{!compact && <span>Luật chơi</span>}</button>
    <dialog ref={dialog} className={"uno-rules-dialog " + className} aria-labelledby={title} onClose={() => trigger.current?.focus()} onClick={event => { if (event.target === dialog.current) dialog.current.close(); }}>
      <header className="uno-rules-header"><div><span className="uno-rules-kicker">HƯỚNG DẪN CHƠI · MEEPLEVERSE</span><h2 id={title}>{label}</h2></div><button type="button" autoFocus aria-label="Đóng hướng dẫn luật chơi" onClick={() => dialog.current?.close()}>×</button></header>
      <div ref={body} className="uno-rules-body" tabIndex={0} aria-label="Nội dung hướng dẫn luật chơi">{children}</div>
      <footer className="uno-rules-footer"><span>{footer}</span><button type="button" className="button primary" onClick={() => dialog.current?.close()}>Đã hiểu, vào bàn thôi</button></footer>
    </dialog>
  </>;
}

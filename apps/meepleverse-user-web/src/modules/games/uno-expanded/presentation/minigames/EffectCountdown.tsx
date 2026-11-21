"use client";
import { useEffect, useState } from "react";
export function EffectCountdown({ deadline, remainingMs, paused }: { deadline: number | null; remainingMs?: number | null; paused: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (paused || deadline === null) return; const timer = setInterval(() => setNow(Date.now()), 200); return () => clearInterval(timer); }, [deadline, paused]);
  const seconds = Math.ceil(Math.max(0, paused && remainingMs != null ? remainingMs : deadline === null ? 0 : deadline - now) / 1000);
  return <span className="mini-countdown" role="timer" aria-label="Thời gian còn lại">{paused ? "Tạm dừng · " : ""}{seconds}s</span>;
}

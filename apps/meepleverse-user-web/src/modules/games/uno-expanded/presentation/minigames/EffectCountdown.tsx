"use client";
import { playSound } from "@/shared/audio/audio";
import { useEffect, useRef, useState } from "react";
export function EffectCountdown({ deadline, remainingMs, paused, warningId, audible = false }: { deadline: number | null; remainingMs?: number | null; paused: boolean; warningId?: string; audible?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { if (paused || deadline === null) return; const timer = setInterval(() => setNow(Date.now()), 200); return () => clearInterval(timer); }, [deadline, paused]);
  const seconds = Math.ceil(Math.max(0, paused && remainingMs != null ? remainingMs : deadline === null ? 0 : deadline - now) / 1000);
  const warned = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (warningId && audible && !paused && deadline !== null && seconds > 0 && seconds <= 5 && warned.current !== warningId) {
      warned.current = warningId; playSound("turn");
    }
  }, [warningId, audible, paused, deadline, seconds]);
  return <span className={"mini-countdown" + (warningId && seconds <= 5 && !paused ? " is-urgent" : "")} role="timer" aria-label="Thời gian còn lại">{paused ? "Tạm dừng · " : ""}{seconds}s</span>;
}

"use client";
import { useEffect, useRef, useState } from "react";
import type { TurnClockView } from "@meepleverse/contracts/room-common";
import { playSound } from "@/shared/audio/audio";
import "./turn-countdown.css";
export function TurnCountdown({ clock, matchId, audible = false }: { clock: TurnClockView; matchId: string | null; audible?: boolean }) {
  const [tick, setTick] = useState(() => ({ sample: clock.serverNow, time: clock.serverNow }));
  const warned = useRef<string | null>(null);
  useEffect(() => {
    if (clock.deadline === null) return;
    const receivedAt = Date.now();
    const update = () => setTick({ sample: clock.serverNow, time: clock.serverNow + Date.now() - receivedAt });
    const first = setTimeout(update, 0); const interval = setInterval(update, 200);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [clock.id, clock.deadline, clock.serverNow]);
  const now = tick.sample === clock.serverNow ? tick.time : clock.serverNow;
  const seconds = Math.ceil(Math.max(0, clock.deadline === null ? clock.remainingMs : clock.deadline - now) / 1000);
  const key = `${matchId}:${clock.id}`;
  useEffect(() => {
    if (audible && clock.deadline !== null && seconds > 0 && seconds <= 5 && warned.current !== key) {
      warned.current = key; playSound("turn");
    }
  }, [audible, clock.deadline, seconds, key]);
  return <span className={`turn-countdown${seconds <= 5 ? " is-urgent" : ""}${clock.deadline === null ? " is-paused" : ""}`} role="timer"
    aria-label={clock.deadline === null ? "Đồng hồ lượt tạm dừng" : "Thời gian đánh bài còn lại"}
    data-clock-id={clock.id} data-player-id={clock.playerId} data-deadline={clock.deadline ?? ""} data-remaining-ms={clock.remainingMs} data-duration-ms={clock.durationMs} data-clock-kind={clock.kind}>
    <span aria-hidden="true">{clock.deadline === null ? "Ⅱ" : "◷"}</span> {seconds}s
  </span>;
}

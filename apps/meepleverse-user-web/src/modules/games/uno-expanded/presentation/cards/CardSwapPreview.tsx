"use client";
import { useId } from "react";
import { CardBack } from "@/modules/games/uno-common/presentation/components/CardBack";
import "./expanded-cards.css";

const INK = "#121212";
const PAPER = "#fffdf8";
const W = 25;
const H = 35;

const FAN_ANGLES = [36, 24, 12];

function HandWithCards({ corner = false }: { corner?: boolean }) {
  const h = H;
  const handInk = corner ? PAPER : INK;
  const arm = [
    "M-12 " + (-h + 9),
    "L-12 " + (-h - 6),
    ...(corner ? [
      "Q-11.8 " + (-h - 10) + " -9.5 " + (-h - 14),
      "L8 " + (-h - 14),
      "Q6.5 " + (-h - 10) + " 6.1 " + (-h - 6),
    ] : [
      "C-12 " + (-h - 9) + " -11.4 " + (-h - 12.3) + " -9.5 " + (-h - 16),
      "C-7.8 " + (-h - 20) + " -5 " + (-h - 27) + " -4 " + (-h - 34),
      "L14 " + (-h - 34),
      "C8 " + (-h - 27) + " 6.2 " + (-h - 20) + " 6.1 " + (-h - 12),
    ]),
    "C6.1 " + (-h - 6) + " 6 " + (-h - 2) + " 5.4 " + (-h + 0.8),
    "C4.8 " + (-h + 8) + " 2.8 " + (-h + 14) + " -0.5 " + (-h + 17),
    "L-4 " + (-h + 17) + "L-12 " + (-h + 9) + "Z",
  ].join("");
  const thumb = [
    "M-3.6 " + (-h - 1.5),
    "C-4.4 " + (-h + 3.5) + " -6.4 " + (-h + 8.5) + " -10.2 " + (-h + 12.4),
    "A2.9 2.9 0 0 1 -14.6 " + (-h + 9),
    "C-13.6 " + (-h + 5.5) + " -12.8 " + (-h + 1.5) + " -11.6 " + (-h - 1.5) + "Z",
  ].join("");
  return <g>
    {FAN_ANGLES.map((angle, index) => (
      <g key={angle} transform={`translate(${(3 - index) * 2.5} ${[-2.8, -3.5, -2][index]}) rotate(${angle} ${-W} ${-H})`}>
        <rect x={-W} y={-H} width={W} height={H} rx="1.8" fill={corner ? INK : "#203f2b"} stroke={handInk} strokeWidth="1" />
        {!corner && <rect x={-W + 1} y={-H + 1} width={W - 2} height={H - 2} rx="1" fill="none" stroke={PAPER} strokeWidth=".5" />}
      </g>
    ))}
    <path d={arm} fill={handInk} />
    {!corner && <svg aria-hidden="true" focusable="false" x={-W} y={-H} width={W} height={H} viewBox="0 0 100 140"><CardBack /></svg>}
    <rect x={-W} y={-H} width={W} height={H} rx="1.8" fill={corner ? INK : "none"} stroke={handInk} strokeWidth="1" />
    <path d={thumb} fill={handInk} />
  </g>;
}

export function CardSwapPreview() {
  const clipId = "card-swap-clip-" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return <svg className="expanded-card-face" viewBox="0 0 100 144" role="img" aria-label="Xem trước lá Đổi tay bài: hai bàn tay trao đổi bộ bài" focusable="false" data-card-preview="card-swap">
    <defs><clipPath id={clipId}><rect x="3.5" y="3.5" width="93" height="137" rx="5" /></clipPath></defs>
    <rect width="100" height="144" rx="8" fill={PAPER} />
    <rect x="3.5" y="3.5" width="93" height="137" rx="5" fill={INK} />
    <ellipse cx="50" cy="72" rx="36" ry="66" transform="rotate(25 50 72)" fill={PAPER} />
    <g clipPath={"url(#" + clipId + ")"}>
      <g transform="translate(80 62)"><HandWithCards /></g>
      <g transform="rotate(180 50 72) translate(80 62)"><HandWithCards /></g>
    </g>
    <g transform="translate(22 27) scale(.35)"><HandWithCards corner /></g>
    <g transform="rotate(180 50 72) translate(22 27) scale(.35)" aria-hidden="true"><HandWithCards corner /></g>
  </svg>;
}
import { useId } from "react";
import "./card-back.css";

export function CardBack() {
  const patternId = useId();
  return <svg className="uno-card-back" data-card-back="meepleverse" viewBox="0 0 100 140" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <defs><pattern id={patternId} width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#203f2b" /><path d="M-2-2 12 12M8-2 12 2M-2 8 2 12" stroke="#2c5339" strokeWidth="2" /></pattern></defs>
    <rect x="2" y="2" width="96" height="136" rx="8" fill={"url(#" + patternId + ")"} stroke="#f7f3e9" strokeWidth="4" />
    <ellipse cx="50" cy="70" rx="29" ry="45" transform="rotate(24 50 70)" fill="none" stroke="#c8b27b" strokeOpacity=".65" strokeWidth="1.5" />
    <path d="M50 50Q54 66 67 70Q54 74 50 90Q46 74 33 70Q46 66 50 50Z" fill="#e1c68a" />
  </svg>;
}

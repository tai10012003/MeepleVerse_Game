import "../uno-primitives.css";
import type { UnoColor } from "@meepleverse/contracts/uno-common";
import { colorNames } from "../../model/color-names";
export function DirectionRing({ color, direction }: { color: UnoColor | null; direction: 1 | -1 }) {
  return <div className={"direction-ring color-" + (color ?? "wild")} data-testid="direction-ring" data-color={color ?? "wild"} data-direction={direction}
    role="img" aria-label={(direction === 1 ? "Thuận chiều" : "Ngược chiều") + (color ? " · Màu " + colorNames[color] : " · Chờ chọn màu")}>
    <svg viewBox="0 0 320 320" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <g className="direction-ring-orbit" style={{ animationDirection: direction === 1 ? "normal" : "reverse" }}>
        <g transform={direction === 1 ? undefined : "translate(320 0) scale(-1 1)"} fill="currentColor">
          <path d="M73 53A138 138 0 0 1 293 123" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" /><path d="M301 146L271 122L298 108Z" />
          <g transform="rotate(180 160 160)"><path d="M73 53A138 138 0 0 1 293 123" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" /><path d="M301 146L271 122L298 108Z" /></g>
        </g>
      </g>
    </svg>
  </div>;
}

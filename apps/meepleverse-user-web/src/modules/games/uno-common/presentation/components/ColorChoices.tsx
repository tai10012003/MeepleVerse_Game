"use client";
import { UNO_COLORS, type UnoColor } from "@meepleverse/contracts/uno-common";
import { colorNames } from "../../model/color-names";
import "../uno-primitives.css";
export function ColorChoices({ disabled, onChoose, value }: { disabled: boolean; onChoose: (color: UnoColor) => void; value?: UnoColor }) {
  return <div className="color-choices">{UNO_COLORS.map(color => <button type="button" key={color} className={`color-choice color-${color}`}
    aria-pressed={value === color} disabled={disabled} onClick={() => onChoose(color)}>{colorNames[color]}</button>)}</div>;
}

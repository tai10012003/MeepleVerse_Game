import type { UnoStandardCard } from "@meepleverse/contracts/uno-common";

const inks = { red: "#e52332", blue: "#0878bd", yellow: "#f5cd19", green: "#55a632" };

export function WildMark({ className = "" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 100 140" aria-hidden="true" focusable="false">
    <g transform="rotate(28 50 70)">
      <path d="M50 70V22A31 48 0 0 0 19 70Z" fill={inks.red} />
      <path d="M50 70H81A31 48 0 0 0 50 22Z" fill={inks.blue} />
      <path d="M50 70V118A31 48 0 0 0 81 70Z" fill={inks.green} />
      <path d="M50 70H19A31 48 0 0 0 50 118Z" fill={inks.yellow} />
      <ellipse cx="50" cy="70" rx="31" ry="48" fill="none" stroke="#fff" strokeWidth="3.5" />
    </g>
  </svg>;
}

function MiniCard({ x, y, fill }: { x: number; y: number; fill: string }) {
  return <g>
    <rect x={x} y={y} width="23" height="35" rx="2.5" fill={fill} stroke="#161616" strokeWidth="1.2" strokeLinejoin="round" />
    <path d={`M${x + 3} ${y + 31}V${y + 5}Q${x + 3} ${y + 3} ${x + 5} ${y + 3}H${x + 18}`} fill="none" stroke="#fff" strokeOpacity=".48" strokeWidth="1" />
  </g>;
}

export function ActionArtwork({ kind }: { kind: UnoStandardCard["kind"] }) {
  if (kind === "wild") return <WildMark className="card-action-art" />;
  if (kind === "skip" || kind === "reverse") return <svg className="card-action-art card-symbol-art" data-symbol-kind={kind} viewBox="0 0 100 140" aria-hidden="true" focusable="false">
    <g data-symbol-shape="true" transform={kind === "reverse" ? "translate(23 35.44) scale(.54)" : "translate(16 36) scale(1.4166667)"}>
      {kind === "reverse" ? <ReverseShape /> : <SkipShape />}
    </g>
  </svg>;
  if (kind !== "draw-two" && kind !== "wild-draw-four") return null;
  return <svg className="card-action-art" viewBox="0 0 100 140" aria-hidden="true" focusable="false">
    {kind === "draw-two" ? <>
      <MiniCard x={46} y={43} fill="#fafaf5" />
      <MiniCard x={31} y={62} fill="#fafaf5" />
    </> : <>
      <ellipse cx="50" cy="70" rx="32" ry="53" transform="rotate(28 50 70)" fill="#f8f8f3" />
      <MiniCard x={19} y={72} fill={inks.green} />
      <MiniCard x={34} y={48} fill={inks.blue} />
      <MiniCard x={58} y={33} fill={inks.yellow} />
      <MiniCard x={46} y={59} fill={inks.red} />
    </>}
  </svg>;
}

function ReverseShape() {
  return <g transform="translate(2.5 1)" fill="currentColor" stroke="#111" strokeWidth="2.2" strokeLinejoin="round">
    <path d="M41 3H95L89 50L76 37C62 50 49 62 38 68C31 71 24 65 25 57C26 48 37 36 54 18Z" />
    <path transform="rotate(180 47.5 63)" d="M41 3H95L89 50L76 37C62 50 49 62 38 68C31 71 24 65 25 57C26 48 37 36 54 18Z" />
  </g>;
}
export function ReverseMark() {
  return <svg className="reverse-mark" viewBox="0 0 100 128" aria-hidden="true" focusable="false"><ReverseShape /></svg>;
}
function SkipShape() {
  return <>
    <g fill="none" stroke="#111" strokeWidth="6.2"><circle cx="24" cy="24" r="17" /><path d="M12 36L36 12" /></g>
    <g fill="none" stroke="currentColor" strokeWidth="5"><circle cx="24" cy="24" r="17" /><path d="M12 36L36 12" /></g>
  </>;
}
export function SkipMark() {
  return <svg className="skip-mark" viewBox="0 0 48 48" aria-hidden="true" focusable="false"><SkipShape /></svg>;
}
export function NumberArtwork({ value }: { value: number }) {
  return <svg className="card-number-art" viewBox="0 0 100 140" aria-hidden="true" focusable="false">
    <text x="47" y="70" dominantBaseline="central" textAnchor="middle" fill="#fff" stroke="#111" strokeWidth="2.4" paintOrder="stroke" fontFamily="Arial Black, Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="66">{value}</text>
    {(value === 6 || value === 9) && <path d="M34 109H65" stroke="#fff" strokeWidth="3" />}
  </svg>;
}

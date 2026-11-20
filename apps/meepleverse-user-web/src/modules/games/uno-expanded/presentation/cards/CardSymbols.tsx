import { CARD_INKS } from "../../model/card-presentation";
export function FourColorOval() {
  return <g transform="rotate(28 50 72)">
    <path d="M50 72V21A32 51 0 0 0 18 72Z" fill={CARD_INKS.red} />
    <path d="M50 72H82A32 51 0 0 0 50 21Z" fill={CARD_INKS.blue} />
    <path d="M50 72V123A32 51 0 0 0 82 72Z" fill={CARD_INKS.green} />
    <path d="M50 72H18A32 51 0 0 0 50 123Z" fill={CARD_INKS.yellow} />
    <ellipse cx="50" cy="72" rx="32" ry="51" fill="none" stroke="#fff" strokeWidth="2.5" />
  </g>;
}
export function ShieldSymbol() {
  return <g stroke="#161616" strokeWidth="2" strokeLinejoin="round">
    <path d="M50 8L85 23L81 51H50Z" fill={CARD_INKS.blue} />
    <path d="M50 8L15 23L19 51H50Z" fill={CARD_INKS.red} />
    <path d="M19 51H50V93Q25 75 19 51Z" fill={CARD_INKS.yellow} />
    <path d="M81 51H50V93Q75 75 81 51Z" fill={CARD_INKS.green} />
  </g>;
}
export function UpSymbol({ corner = false }: { corner?: boolean }) {
  if (corner) return <g fill="currentColor"><path d="M12 49L50 14L88 49L78 60L50 35L22 60Z" /><path d="M12 79L50 44L88 79L78 90L50 65L22 90Z" /></g>;
  return <g stroke="#161616" strokeWidth="1.8" strokeLinejoin="round">
    {[CARD_INKS.red, CARD_INKS.yellow, CARD_INKS.green, CARD_INKS.blue].map((color, index) => <path key={color}
      transform={`translate(0 ${index * 20})`} d="M15 19Q11 12 19 10L69 0Q76-1 77 6L84 37Q85 44 79 40L65 27L23 27Q17 27 15 19Z" fill={color} />)}
  </g>;
}
export function SwordsSymbol() {
  return <g fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 83L73 21L84 12L81 28L29 90M13 68L37 89M79 83L27 21L16 12L19 28L71 90M87 68L63 89" />
  </g>;
}
export function HandSymbol() {
  return <path fill="currentColor" d="M26 53V23Q26 15 33 15Q39 15 39 23V45H42V12Q42 4 49 4Q56 4 56 12V44H59V17Q59 9 66 9Q73 9 73 17V47H76V30Q76 22 83 22Q90 22 90 30V64Q90 89 65 94H53Q41 94 33 83L14 59Q8 50 16 46Q21 43 26 53Z" />;
}
export function SkipSymbol() {
  return <g fill="none" stroke="currentColor" strokeWidth="8"><circle cx="50" cy="50" r="32" /><path d="M27 73L73 27" /></g>;
}
export function TargetSymbol() {
  return <g stroke="#171717" strokeWidth="6">
    <path d="M50 50V13A37 37 0 0 0 13 50Z" fill={CARD_INKS.green} stroke="none" />
    <path d="M50 50H87A37 37 0 0 0 50 13Z" fill={CARD_INKS.yellow} stroke="none" />
    <path d="M50 50V87A37 37 0 0 0 87 50Z" fill={CARD_INKS.red} stroke="none" />
    <path d="M50 50H13A37 37 0 0 0 50 87Z" fill={CARD_INKS.blue} stroke="none" />
    <circle cx="50" cy="50" r="37" fill="none" /><path d="M50 1V30M50 70V99M1 50H30M70 50H99" /><circle cx="50" cy="50" r="4" fill="#171717" />
  </g>;
}
const tornadoArms = Array.from({ length: 5 }, (_, arm) => Array.from({ length: 29 }, (_, step) => {
  const progress = step / 28; const radius = 3 + progress * 40; const angle = arm * Math.PI * 2 / 5 + progress * 3.7;
  return `${step ? "L" : "M"}${(50 + Math.cos(angle) * radius).toFixed(2)} ${(50 + Math.sin(angle) * radius).toFixed(2)}`;
}).join(" "));
export function TornadoSymbol() {
  return <g fill="none" stroke="currentColor" strokeWidth="4.8" strokeLinecap="round" strokeLinejoin="round">
    {tornadoArms.map((path, index) => <path key={index} d={path} />)}
  </g>;
}
export function SevenSymbol({ direction }: { direction: "L" | "R" }) {
  return <g>
    <g transform={direction === "L" ? undefined : "translate(100 0) scale(-1 1)"} fill="currentColor">
      <path d="M15 63C4 30 29 7 61 15L60 5L83 24L57 34L59 24C35 17 15 37 23 61Z" />
      <path transform="rotate(180 50 50)" d="M15 63C4 30 29 7 61 15L60 5L83 24L57 34L59 24C35 17 15 37 23 61Z" />
    </g>
    <text x="48" y="52" dominantBaseline="central" textAnchor="middle" fontSize="66" fill="currentColor" fontWeight="900" fontStyle="italic" stroke="#111" strokeWidth="1" paintOrder="stroke">7</text>
  </g>;
}
export function CardCluster({ divide = false, doubled = false }: { divide?: boolean; doubled?: boolean }) {
  const cards = (offsetX = 0, offsetY = 0) => <g transform={`translate(${offsetX} ${offsetY}) rotate(16 50 50)`} stroke="#171717" strokeWidth="1.3">
    {([[22, 39, "green"], [35, 22, "blue"], [59, 11, "yellow"], [49, 39, "red"]] as const).map(([x, y, color]) => <rect key={color} x={x} y={y} width="25" height="40" rx="2.5" fill={CARD_INKS[color]} />)}
  </g>;
  return <g>{doubled ? <><g transform="translate(16 1) scale(.65)">{cards()}</g><g transform="translate(-1 43) scale(.65)">{cards()}</g></> : cards()}
    {divide && <><path d="M10 52H91" stroke="#fff" strokeWidth="5" /><path d="M10 52H91" stroke="#171717" strokeWidth="1.2" strokeDasharray="4 3" /></>}
  </g>;
}
export function DiscardSymbol({ wild = false }: { wild?: boolean }) {
  return <g stroke={wild ? "#171717" : "currentColor"} strokeWidth="2.5" strokeLinejoin="round">
    <rect x="16" y="27" width="43" height="56" rx="3" fill={wild ? "#fff" : "currentColor"} transform="rotate(-14 38 55)" />
    <rect x="26" y="22" width="43" height="56" rx="3" fill={wild ? "#fff" : "currentColor"} transform="rotate(-6 48 50)" />
    <rect x="37" y="17" width="43" height="56" rx="3" fill={wild ? "#fff" : "currentColor"} />
    <path d="M47 32L70 57M70 32L47 57" stroke={wild ? CARD_INKS.red : "#fff"} strokeWidth="5" />
  </g>;
}

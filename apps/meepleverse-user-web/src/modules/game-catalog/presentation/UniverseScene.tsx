export function UniverseScene() {
  return <div className="universe-scene" aria-hidden="true">
    <div className="universe-glow" />
    <svg viewBox="0 0 520 440" fill="none" focusable="false">
      <defs>
        <linearGradient id="verse-table" x1="260" y1="180" x2="260" y2="395" gradientUnits="userSpaceOnUse"><stop stopColor="#365c49" /><stop offset="1" stopColor="#142c26" /></linearGradient>
        <linearGradient id="verse-mint" x1="192" y1="140" x2="272" y2="285" gradientUnits="userSpaceOnUse"><stop stopColor="#d7edb1" /><stop offset="1" stopColor="#78a773" /></linearGradient>
        <linearGradient id="verse-gold" x1="350" y1="90" x2="400" y2="234" gradientUnits="userSpaceOnUse"><stop stopColor="#ffe1a1" /><stop offset="1" stopColor="#cf9355" /></linearGradient>
      </defs>
      <ellipse cx="267" cy="299" rx="211" ry="102" fill="#081b17" opacity=".6" />
      <ellipse cx="260" cy="283" rx="211" ry="99" fill="url(#verse-table)" stroke="#77906a" strokeOpacity=".45" />
      <ellipse cx="260" cy="276" rx="191" ry="80" stroke="#b4ce93" strokeOpacity=".2" />
      <ellipse cx="260" cy="244" rx="249" ry="101" stroke="#b8d48b" strokeOpacity=".3" transform="rotate(-23 260 244)" />
      <ellipse cx="260" cy="244" rx="222" ry="120" stroke="#eab36f" strokeOpacity=".24" transform="rotate(23 260 244)" />
      <ellipse cx="246" cy="269" rx="49" ry="16" fill="#071e18" opacity=".6" />
      <path d="M218 171a24 24 0 1 1 48 0c0 10-5 18-12 22 20 6 38 23 53 36l-18 26-26-15 15 65h-32l-7-41-7 41h-32l15-65-25 15-18-26c15-13 33-30 53-36-5-5-7-13-7-22Z" fill="#526d49" transform="translate(4 8)" />
      <path d="M218 171a24 24 0 1 1 48 0c0 10-5 18-12 22 20 6 38 23 53 36l-18 26-26-15 15 65h-32l-7-41-7 41h-32l15-65-25 15-18-26c15-13 33-30 53-36-5-5-7-13-7-22Z" fill="url(#verse-mint)" />
      <g transform="translate(98 103) rotate(-22)"><rect x="7" y="10" width="68" height="96" rx="9" fill="#09271f" /><rect width="68" height="96" rx="9" fill="#efb267" stroke="#ffe5b7" strokeWidth="3" /><ellipse cx="34" cy="48" rx="22" ry="34" transform="rotate(25 34 48)" stroke="#fff0cf" strokeWidth="2" /><path d="m23 47 8 8 16-18" stroke="#17392c" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></g>
      <g transform="translate(344 91)"><ellipse cx="30" cy="137" rx="39" ry="12" fill="#071e18" opacity=".5" /><path d="M4 117h52l7 15H-3ZM10 110c17-20 16-44 14-58h14c-2 14-3 38 14 58ZM11 40h40l-6 12H17Z" fill="url(#verse-gold)" /><circle cx="31" cy="22" r="21" fill="url(#verse-gold)" /><path d="M18 10c3-4 7-6 12-6" stroke="#fff1cd" strokeWidth="3" strokeLinecap="round" /></g>
      <g transform="translate(349 288) rotate(16)"><rect x="4" y="7" width="70" height="70" rx="17" fill="#172b25" /><rect width="70" height="70" rx="17" fill="#e6e9d6" /><g fill="#274737"><circle cx="20" cy="20" r="5" /><circle cx="50" cy="20" r="5" /><circle cx="35" cy="35" r="5" /><circle cx="20" cy="50" r="5" /><circle cx="50" cy="50" r="5" /></g></g>
      <g transform="translate(118 310)"><ellipse rx="30" ry="12" fill="#aa7650" /><ellipse cy="-7" rx="30" ry="12" fill="#eab36f" /><ellipse cy="-8" rx="21" ry="7" stroke="#ffe0a2" /></g>
      <circle cx="53" cy="301" r="6" fill="#eab36f" /><circle cx="452" cy="179" r="5" fill="#c6dfa0" />
      <path d="m294 62 4 12 12 4-12 4-4 12-4-12-12-4 12-4Z" fill="#eab36f" /><path d="m459 310 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="#c6dfa0" />
      <circle cx="168" cy="57" r="2" fill="#c6dfa0" /><circle cx="483" cy="103" r="2" fill="#c6dfa0" /><circle cx="73" cy="199" r="2" fill="#eab36f" />
    </svg>
    <span className="scene-label">MỘT VŨ TRỤ. NHIỀU CUỘC VUI.</span>
  </div>;
}

// Notely's mascot: a friendly spiral-bound notebook character holding a
// pencil and a page of notes. This is the single source of truth for the
// artwork. Two variants:
// - full: the whole character (arms, pencil, paper, legs, shoes) — used
//   where it's shown large enough to read clearly (homepage hero).
// - icon: just the notebook body + spiral + bookmark + face — used
//   anywhere it's rendered small (favicon, PWA icons, header), where limbs
//   would just be illegible blobs.
// scripts/generate-icons.mjs duplicates the icon markup because it runs as
// a standalone script outside Next's TS pipeline — keep the two in sync.

const INK = "#161616";
const BODY = "#5FC7F2";
const RIBBON = "#F2547D";
const CHEEK = "#E79BC0";

export function mascotIconSvgMarkup(): string {
  return `<svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">
  <rect x="40" y="40" width="240" height="240" rx="34" fill="${BODY}" stroke="${INK}" stroke-width="9"/>
  <circle cx="40" cy="75" r="11" fill="#ffffff" stroke="${INK}" stroke-width="7"/>
  <circle cx="40" cy="115" r="11" fill="#ffffff" stroke="${INK}" stroke-width="7"/>
  <circle cx="40" cy="155" r="11" fill="#ffffff" stroke="${INK}" stroke-width="7"/>
  <circle cx="40" cy="195" r="11" fill="#ffffff" stroke="${INK}" stroke-width="7"/>
  <circle cx="40" cy="235" r="11" fill="#ffffff" stroke="${INK}" stroke-width="7"/>
  <path d="M143,0 H187 V60 L165,44 L143,60 Z" fill="${RIBBON}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>
  <circle cx="120" cy="150" r="15" fill="${INK}"/>
  <circle cx="115" cy="144" r="5" fill="#ffffff"/>
  <circle cx="200" cy="150" r="15" fill="${INK}"/>
  <circle cx="195" cy="144" r="5" fill="#ffffff"/>
  <ellipse cx="108" cy="192" rx="18" ry="12" fill="${CHEEK}" opacity="0.85"/>
  <ellipse cx="212" cy="192" rx="18" ry="12" fill="${CHEEK}" opacity="0.85"/>
  <path d="M132,202 Q160,224 188,202" stroke="${INK}" stroke-width="9" fill="none" stroke-linecap="round"/>
</svg>`;
}

export function mascotFullSvgMarkup(): string {
  return `<svg viewBox="0 0 320 400" xmlns="http://www.w3.org/2000/svg">
  <ellipse cx="180" cy="378" rx="88" ry="10" fill="#000000" opacity="0.12"/>

  <rect x="148" y="288" width="26" height="52" rx="10" fill="#F2F2F2" stroke="${INK}" stroke-width="7"/>
  <rect x="196" y="288" width="26" height="52" rx="10" fill="#F2F2F2" stroke="${INK}" stroke-width="7"/>

  <rect x="132" y="325" width="58" height="32" rx="16" fill="${RIBBON}" stroke="${INK}" stroke-width="7"/>
  <rect x="132" y="345" width="58" height="10" rx="4" fill="#ffffff"/>
  <rect x="182" y="325" width="58" height="32" rx="16" fill="${RIBBON}" stroke="${INK}" stroke-width="7"/>
  <rect x="182" y="345" width="58" height="10" rx="4" fill="#ffffff"/>

  <path d="M92,150 Q40,175 58,252" stroke="${INK}" stroke-width="34" fill="none" stroke-linecap="round"/>
  <path d="M92,150 Q40,175 58,252" stroke="${BODY}" stroke-width="24" fill="none" stroke-linecap="round"/>
  <path d="M268,150 Q320,175 262,248" stroke="${INK}" stroke-width="34" fill="none" stroke-linecap="round"/>
  <path d="M268,150 Q320,175 262,248" stroke="${BODY}" stroke-width="24" fill="none" stroke-linecap="round"/>

  <rect x="90" y="70" width="180" height="220" rx="34" fill="${BODY}" stroke="${INK}" stroke-width="9"/>
  <circle cx="90" cy="100" r="11" fill="#ffffff" stroke="${INK}" stroke-width="7"/>
  <circle cx="90" cy="133" r="11" fill="#ffffff" stroke="${INK}" stroke-width="7"/>
  <circle cx="90" cy="166" r="11" fill="#ffffff" stroke="${INK}" stroke-width="7"/>
  <circle cx="90" cy="199" r="11" fill="#ffffff" stroke="${INK}" stroke-width="7"/>
  <circle cx="90" cy="232" r="11" fill="#ffffff" stroke="${INK}" stroke-width="7"/>
  <path d="M163,25 H197 V88 L180,72 L163,88 Z" fill="${RIBBON}" stroke="${INK}" stroke-width="7" stroke-linejoin="round"/>

  <circle cx="155" cy="170" r="13" fill="${INK}"/>
  <circle cx="150" cy="165" r="4" fill="#ffffff"/>
  <circle cx="205" cy="170" r="13" fill="${INK}"/>
  <circle cx="200" cy="165" r="4" fill="#ffffff"/>
  <ellipse cx="140" cy="205" rx="16" ry="11" fill="${CHEEK}" opacity="0.85"/>
  <ellipse cx="220" cy="205" rx="16" ry="11" fill="${CHEEK}" opacity="0.85"/>
  <path d="M158,215 Q180,232 202,215" stroke="${INK}" stroke-width="8" fill="none" stroke-linecap="round"/>

  <circle cx="58" cy="255" r="22" fill="${BODY}" stroke="${INK}" stroke-width="8"/>
  <circle cx="262" cy="250" r="22" fill="${BODY}" stroke="${INK}" stroke-width="8"/>

  <g transform="rotate(-15 58 255)">
    <path d="M50,255 h16 l-8,-20 z" fill="${RIBBON}" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <rect x="50" y="255" width="16" height="68" fill="#F4C64B" stroke="${INK}" stroke-width="6"/>
    <path d="M50,323 h16 l-8,18 z" fill="#3A3A3A" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  </g>

  <g transform="rotate(8 262 250)">
    <rect x="225" y="220" width="72" height="88" rx="8" fill="#ffffff" stroke="${INK}" stroke-width="7"/>
    <line x1="237" y1="240" x2="285" y2="240" stroke="#B9C2CC" stroke-width="6" stroke-linecap="round"/>
    <line x1="237" y1="256" x2="285" y2="256" stroke="#B9C2CC" stroke-width="6" stroke-linecap="round"/>
    <line x1="237" y1="272" x2="285" y2="272" stroke="#B9C2CC" stroke-width="6" stroke-linecap="round"/>
    <line x1="237" y1="288" x2="278" y2="288" stroke="#B9C2CC" stroke-width="6" stroke-linecap="round"/>
  </g>
</svg>`;
}

export function mascotIconDataUri(): string {
  return `data:image/svg+xml;base64,${Buffer.from(mascotIconSvgMarkup()).toString("base64")}`;
}

export function mascotFullDataUri(): string {
  return `data:image/svg+xml;base64,${Buffer.from(mascotFullSvgMarkup()).toString("base64")}`;
}

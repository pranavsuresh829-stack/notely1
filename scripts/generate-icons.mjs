// Rasterizes Notely's mascot (src/lib/mascot.ts) into the PNG icons the PWA
// manifest and Apple touch icon need. Uses next/og's bundled ImageResponse
// (satori + resvg) so there's no extra image-processing dependency to add —
// it's already inside the installed `next` package.
import { writeFileSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const { ImageResponse } = await import(
  pathToFileURL(path.join(__dirname, "..", "node_modules", "next", "og.js")).href
);

// Keep this in sync with mascotIconSvgMarkup() in src/lib/mascot.ts —
// duplicated here because this script runs standalone via plain `node`,
// outside Next's TS/JSX pipeline. This is the simplified (no limbs) variant
// since these all render small.
const MASCOT_SVG = `<svg viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">
  <rect x="40" y="40" width="240" height="240" rx="34" fill="#5FC7F2" stroke="#161616" stroke-width="9"/>
  <circle cx="40" cy="75" r="11" fill="#ffffff" stroke="#161616" stroke-width="7"/>
  <circle cx="40" cy="115" r="11" fill="#ffffff" stroke="#161616" stroke-width="7"/>
  <circle cx="40" cy="155" r="11" fill="#ffffff" stroke="#161616" stroke-width="7"/>
  <circle cx="40" cy="195" r="11" fill="#ffffff" stroke="#161616" stroke-width="7"/>
  <circle cx="40" cy="235" r="11" fill="#ffffff" stroke="#161616" stroke-width="7"/>
  <path d="M143,0 H187 V60 L165,44 L143,60 Z" fill="#F2547D" stroke="#161616" stroke-width="7" stroke-linejoin="round"/>
  <circle cx="120" cy="150" r="15" fill="#161616"/>
  <circle cx="115" cy="144" r="5" fill="#ffffff"/>
  <circle cx="200" cy="150" r="15" fill="#161616"/>
  <circle cx="195" cy="144" r="5" fill="#ffffff"/>
  <ellipse cx="108" cy="192" rx="18" ry="12" fill="#E79BC0" opacity="0.85"/>
  <ellipse cx="212" cy="192" rx="18" ry="12" fill="#E79BC0" opacity="0.85"/>
  <path d="M132,202 Q160,224 188,202" stroke="#161616" stroke-width="9" fill="none" stroke-linecap="round"/>
</svg>`;
const dataUri = `data:image/svg+xml;base64,${Buffer.from(MASCOT_SVG).toString("base64")}`;

async function renderPng(size, background, scale = 1) {
  const inner = Math.round(size * scale);
  const image = new ImageResponse(
    {
      type: "div",
      props: {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background,
        },
        children: {
          type: "img",
          props: { src: dataUri, width: inner, height: inner },
        },
      },
    },
    { width: size, height: size }
  );
  return Buffer.from(await image.arrayBuffer());
}

// Minimal single-frame ICO wrapper around a PNG buffer (PNG-in-ICO has been
// valid since Windows Vista and every modern browser supports it).
function pngToIco(pngBuffer, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // 1 image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width (0 = 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // color palette
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(pngBuffer.length, 8); // image size
  entry.writeUInt32LE(header.length + entry.length, 12); // offset

  return Buffer.concat([header, entry, pngBuffer]);
}

// Maskable icons need the artwork to fit within the safe zone (~80% of the
// canvas), so pad it on a solid background rather than filling edge-to-edge.
const [icon192, icon512, appleIcon, favicon32] = await Promise.all([
  renderPng(192, "#ffffff", 0.85),
  renderPng(512, "#ffffff", 0.85),
  renderPng(180, "#ffffff", 0.9),
  renderPng(32, "transparent", 1),
]);

writeFileSync(path.join(publicDir, "icon-192.png"), icon192);
writeFileSync(path.join(publicDir, "icon-512.png"), icon512);
writeFileSync(path.join(publicDir, "apple-touch-icon.png"), appleIcon);
writeFileSync(
  path.join(__dirname, "..", "src", "app", "favicon.ico"),
  pngToIco(favicon32, 32)
);

console.log("Generated Notely mascot icons in public/ and src/app/favicon.ico");

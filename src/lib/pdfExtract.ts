import path from "path";
import { pathToFileURL } from "url";
import type { PDFParse as PDFParseType } from "pdf-parse";

// pdfjs-dist (which pdf-parse wraps) references browser-only globals
// (DOMMatrix, ImageData, Path2D) at module-evaluation time, normally
// polyfilling them via the optional @napi-rs/canvas dependency — which we
// don't install, since we only extract text and never render/rasterize a
// page. Without it, pdfjs-dist logs a warning and carries on in some
// environments, but throws a hard ReferenceError on Vercel's runtime,
// crashing the entire module — including every *audio* upload, since our
// route imports this file unconditionally. Minimal stub classes satisfy the
// "is defined" check without ever being exercised for real rendering.
//
// Both this polyfill and the `pdf-parse` import itself have to happen
// lazily inside a function: a static `import ... from "pdf-parse"` at the
// top of this file is hoisted by the module system and evaluated before any
// of our own code runs, which is exactly the crash this works around.
function ensurePdfJsGlobals() {
  const g = globalThis as unknown as Record<string, unknown>;
  if (typeof g.DOMMatrix === "undefined") g.DOMMatrix = class DOMMatrix {};
  if (typeof g.ImageData === "undefined") g.ImageData = class ImageData {};
  if (typeof g.Path2D === "undefined") g.Path2D = class Path2D {};
}

let workerConfigured = false;

async function loadPdfParse(): Promise<typeof PDFParseType> {
  ensurePdfJsGlobals();
  const { PDFParse } = await import("pdf-parse");

  if (!workerConfigured) {
    // pdfjs-dist defaults to a relative import("pdf.worker.mjs") next to
    // wherever its own code ends up — that only works in an unbundled
    // node_modules layout. Turbopack bundles the parser into a server chunk
    // without copying that worker file alongside it, so the default
    // relative import 404s. Pointing setWorker at the file's real on-disk
    // location (as an absolute file:// URL) sidesteps the bundler entirely,
    // since it's a runtime string rather than a static import to trace.
    const workerPath = path.join(
      process.cwd(),
      "node_modules",
      "pdf-parse",
      "dist",
      "worker",
      "pdf.worker.mjs"
    );
    PDFParse.setWorker(pathToFileURL(workerPath).href);
    workerConfigured = true;
  }

  return PDFParse;
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const PDFParse = await loadPdfParse();

  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text.trim();
    if (!text) {
      throw new Error(
        "Couldn't find any text in that PDF — it may be scanned images rather than real text."
      );
    }
    return text;
  } finally {
    await parser.destroy();
  }
}

import path from "path";
import { pathToFileURL } from "url";
import { PDFParse } from "pdf-parse";

// pdfjs-dist (which pdf-parse wraps) defaults to a relative
// import("pdf.worker.mjs") next to wherever its own code ends up — that only
// works in an unbundled node_modules layout. Turbopack bundles the parser
// into a server chunk without copying that worker file alongside it, so the
// default relative import 404s. Pointing setWorker at the file's real
// on-disk location (as an absolute file:// URL) sidesteps Turbopack/webpack
// entirely, since it's a runtime string rather than a static import for the
// bundler to trace.
let workerConfigured = false;
function ensureWorkerConfigured() {
  if (workerConfigured) return;
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

export async function extractPdfText(buffer: Buffer): Promise<string> {
  ensureWorkerConfigured();

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

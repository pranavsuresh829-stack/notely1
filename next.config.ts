import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf-parse's worker file is loaded via a runtime-constructed path
  // (src/lib/pdfExtract.ts), not a static import, so Vercel's build-time
  // file tracing can't discover it on its own and would otherwise leave it
  // out of the deployed function — silently reintroducing the "Cannot find
  // module .../pdf.worker.mjs" error that only running locally (with the
  // full node_modules present) wouldn't catch.
  outputFileTracingIncludes: {
    "/*": ["./node_modules/pdf-parse/dist/worker/**/*"],
  },
};

export default nextConfig;

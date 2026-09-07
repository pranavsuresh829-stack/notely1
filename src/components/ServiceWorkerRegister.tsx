"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Never register in dev: a cache-first SW surviving across restarts made
    // the browser serve a stale "/" no matter what changed on the server or
    // disk — a real footgun for local development, so production-only.
    if (process.env.NODE_ENV !== "production") return;
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Installability is a nice-to-have; ignore registration failures.
      });
    }
  }, []);

  return null;
}

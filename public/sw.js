// Minimal service worker: just enough for the browser's PWA install
// criteria (manifest + registered SW + fetch handler). No offline caching
// of API responses — recording/upload/transcription all need the network
// anyway, so we only cache the static app shell.
const CACHE_NAME = "notely-v1";
const APP_SHELL = ["/", "/manifest.json", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return; // never cache API calls

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

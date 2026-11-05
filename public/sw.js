/* Virtus AI: minimal installability and offline fallback worker.
   Never cache chats, authenticated HTML, API responses, or user data. */
const CACHE_NAME = "virtus-pwa-shell-v1";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(
        keys.filter((key) => key.startsWith("virtus-pwa-shell-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )),
      self.clients.claim(),
    ])
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.mode !== "navigate" || request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(OFFLINE_URL)) ||
        new Response("Virtus AI needs an internet connection.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
    })
  );
});

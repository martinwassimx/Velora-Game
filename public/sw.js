self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response("افتح الإنترنت وحاول تفتح اللعبة تاني.", {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        }),
    ),
  );
});

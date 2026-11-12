/* Ava Desk service worker. Network only: private Desk data is never cached.
   When the phone is offline, page loads get a small offline notice instead of an error. */
const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ava Desk · offline</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f4f6f2;color:#14201a;font-family:system-ui,sans-serif;text-align:center;padding:24px}b{display:block;font:600 26px Georgia,serif;margin-bottom:8px}button{margin-top:16px;border:0;border-radius:10px;background:#f2c14e;padding:12px 18px;font-weight:800}</style></head><body><div><b>You are offline</b>Ava is still answering your calls. Your Desk will load again when you have a connection.<br><button onclick="location.reload()">Try again</button></div></body></html>`;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || request.mode !== 'navigate') return;
  event.respondWith(
    fetch(request).catch(
      () => new Response(OFFLINE_HTML, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } }),
    ),
  );
});

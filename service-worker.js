/* Offline shell cache, v56.6.5 readable binding UI, original generator data. All referenced files exist in ZIP. */
const CACHE = 'battle-exorcists-prod-v56-6.5.0';
const PRECACHE = [
  './readability.css',
  './ritual.css', './ritual.js',
  './refinement.css',
  './folio.css',
  './fieldnotes.css', './fieldnotes.js', './assets/rag-stock.webp', './assets/grimoire-hide.webp', './assets/field-binder.webp', './assets/mending-tape.webp', './assets/fieldnote-edge-1.svg', './assets/fieldnote-edge-2.svg', './assets/fieldnote-edge-3.svg', './assets/fieldnote-edge-4.svg', './assets/fieldnote-edge-5.svg', './assets/fieldnote-edge-6.svg',
  './tabletop.css', './tabletop.js', './assets/tabletop-felt.webp', './assets/cotton-stock.webp', './assets/violet-bookcloth.webp', './assets/ink-leather.webp', './assets/pewter-grain.webp', './assets/print-dust.webp', './assets/wordmark.svg',
  './', './index.html', './styles.css', './app.js', './mobile-ball.js', './manifest.json',
  './icon.svg', './icon-192.png', './icon-512.png',
  './icon-maskable-512.png', './apple-touch-icon.png',
  './assets/parchment-fibers.webp', './assets/aged-cover.webp',
  './assets/laid-rag.webp', './assets/flecked-vellum.webp',
  './assets/soft-kraft.webp', './assets/bookcloth-weave.webp',
  './assets/paper-tape.webp', './assets/liquid-caustics.webp',
  './assets/leather-pressed.webp', './assets/felt-needled.webp',
  './assets/metal-handbrushed.webp', './assets/paper-ink-flecks.webp', './assets/plastic-microtexture.webp', './assets/black-gloss-shell.webp',
  './assets/torn-note-1.png', './assets/torn-note-2.png',
  './assets/torn-note-3.png', './assets/torn-note-4.png',
  './assets/torn-note-5.png', './assets/torn-note-6.png',
  './assets/ball-mobile-back.webp', './assets/ball-mobile-front.webp',
  './assets/ball-mobile-faces.webp', './assets/ball-mobile-resin.webp'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(cache => cache.addAll(PRECACHE))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith('battle-exorcists-') && key !== CACHE)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // Video on iOS requires HTTP byte ranges. Let the server handle all MP4
  // and Range requests directly; never return a cached 200 for a 206 range.
  if (/\.mp4$/i.test(url.pathname) || req.headers.has('range')) return;
  const canonical = new Request(url.origin + url.pathname);
  const code = req.mode === 'navigate' || /\.(?:html|js|css)$/.test(url.pathname);
  if (code) {
    event.respondWith((async () => {
      try {
        // Always try the freshly deployed release, including Safari reloads.
        const res = await fetch(req, {cache:'no-store'});
        if (res.ok) {
          const cache = await caches.open(CACHE);
          try { await cache.put(canonical, res.clone()); } catch (_) { /* Non-fatal quota limit. */ }
        }
        return res;
      } catch (error) {
        const cache = await caches.open(CACHE);
        return await cache.match(canonical) ||
          (req.mode === 'navigate' ? await cache.match('./index.html') : undefined) ||
          Response.error();
      }
    })());
  } else {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(canonical);
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok) {
        try { await cache.put(canonical, res.clone()); } catch (_) { /* Non-fatal quota limit. */ }
      }
      return res;
    })());
  }
});

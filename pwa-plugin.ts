import type { Plugin } from 'vite';
import { createHash } from 'node:crypto';

/**
 * Minimális PWA plugin (külső függőség nélkül):
 * build végén legenerálja a service workert a teljes fájllistával és egy verzió-hash-sel,
 * így minden új build automatikusan új gyorsítótárat kap, a régit pedig törli.
 */
export function pwa(): Plugin {
  return {
    name: 'sorlabor-pwa',
    apply: 'build',
    generateBundle(_opts, bundle) {
      // Betűtípusokból csak a latin + latin-ext woff2 kell előre (a többit csak igény esetén tölti a böngésző)
      const isFont = (f: string) => /\.(woff2?|ttf)$/.test(f);
      const files = Object.keys(bundle).filter(
        (f) => !f.endsWith('.map') && (!isFont(f) || (f.endsWith('.woff2') && /-latin(-ext)?-\d/.test(f))),
      );
      const extra = [
        'manifest.webmanifest',
        'theme-init.js',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/maskable-192.png',
        'icons/maskable-512.png',
        'icons/apple-touch-icon.png',
      ];
      const precache = ['./', ...files, ...extra];
      const version = createHash('sha1').update(precache.join('|')).digest('hex').slice(0, 10);
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: serviceWorker(version, precache) });
    },
  };
}

function serviceWorker(version: string, precache: string[]) {
  return `/* Sörlabor service worker – generált fájl, ne szerkeszd kézzel. */
const CACHE = 'sorlabor-${version}';
const FONT_CACHE = 'sorlabor-fonts';
const PRECACHE = ${JSON.stringify(precache)};

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== FONT_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  // Navigáció: hálózat először (friss verzió), offline esetén a gyorsítótárazott oldal
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./', copy)); return res; })
        .catch(() => caches.match('./', { ignoreSearch: true })),
    );
    return;
  }

  // Statikus fájlok: gyorsítótár először (a hash-elt fájlnevek miatt biztonságos)
  event.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    })),
  );
});
`;
}

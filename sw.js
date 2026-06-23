// ETHOS·TX PEDI — Service Worker
// Estrategia: NETWORK-FIRST para HTML (siempre la versión más fresca cuando hay
// conexión; respaldo a la caché si está offline). Al publicar una nueva versión,
// basta con subir el index.html actualizado — el SW sirve la versión nueva en la
// siguiente apertura con internet. IMPORTANTE: al cambiar CACHE, subir la versión.
const CACHE = 'ethos-tx-pedi-v4_1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icono-192.png',
  './icono-512.png',
  './icono-512-maskable.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.includes('text/html');

  if (isHTML) {
    // Network-first: trae la versión más reciente; si no hay red, usa la caché.
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
  } else {
    // Cache-first para estáticos (íconos, manifest).
    event.respondWith(
      caches.match(req).then((cached) => cached || fetch(req))
    );
  }
});

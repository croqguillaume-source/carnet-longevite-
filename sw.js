/* ============================================================
   SERVICE WORKER — Carnet Longévité
   Gère le cache et le mode hors-ligne
   ============================================================ */

const CACHE_NAME = 'carnet-longevite-v4';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/icon.svg',
  '/manifest.json'
];

/* Installation — mise en cache des assets essentiels */
self.addEventListener('install', event => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] Cache failed:', err))
  );
});

/* Activation — suppression des vieux caches */
self.addEventListener('activate', event => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

/* Fetch — stratégie Network First avec fallback cache */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  /* Laisse passer les requêtes Supabase — toujours en ligne */
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  /* Stratégie : Network First pour l'app shell, cache en fallback */
  event.respondWith(
    fetch(event.request)
      .then(response => {
        /* Mise à jour du cache si la réponse est valide */
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        /* Hors-ligne — on sert depuis le cache */
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            /* Si pas en cache, on retourne la page principale */
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

/* Message pour forcer la mise à jour */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ========================================
   REDEPOP SERVICE WORKER - PERFORMANCE OPTIMIZATIONS
======================================== */
'use strict';

const CACHE_NAME = 'redepop-cache-v1';
const MANIFEST_CACHE = 'redepop-manifest-v1';

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  '/cities.js',
  '/city-selector.js',
  'https://i.ibb.co/BHYkmXfs/Whatsapp-Transparent.gif',
  'https://i.ibb.co/s9x87GHJ/Telegram-logo.gif',
  'https://i.ibb.co/BKdsNcw0/Favicon.png'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then(cache => cache.addAll(CRITICAL_RESOURCES)),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys => {
        return Promise.all(
          keys.filter(key => key !== CACHE_NAME && key !== MANIFEST_CACHE)
            .map(key => caches.delete(key))
        );
      }),
      self.clients.claim()
    ])
  );
});

// Fetch event - cache strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle manifest with network-first strategy for freshness
  if (url.pathname.endsWith('manifest.json')) {
    event.respondWith(handleManifest(event.request));
    return;
  }
  
  // Handle images with cache-first strategy
  if (event.request.destination === 'image') {
    event.respondWith(handleImages(event.request));
    return;
  }
  
  // Handle other resources with stale-while-revalidate
  event.respondWith(handleGenericResources(event.request));
});

// Network-first strategy for manifest (always try fresh data)
async function handleManifest(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(MANIFEST_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('{"tiers":[]}', {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Cache-first strategy for images
async function handleImages(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;
  
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // Return a placeholder image for failed loads
    return new Response(
      '<svg width="250" height="250" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f8f9fa"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">Imagem não disponível</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
}

// Stale-while-revalidate strategy for other resources
async function handleGenericResources(request) {
  const cachedResponse = await caches.match(request);
  const fetchPromise = fetch(request).then(response => {
    const cache = caches.open(CACHE_NAME);
    cache.then(c => c.put(request, response.clone()));
    return response;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'order-submission') {
    event.waitUntil(processOfflineOrders());
  }
});

async function processOfflineOrders() {
  // Process any queued offline orders
  console.log('[SW] Processing offline orders...');
}

// Push notifications support (future enhancement)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova atualização disponível!',
    icon: 'https://i.ibb.co/BKdsNcw0/Favicon.png',
    badge: 'https://i.ibb.co/BKdsNcw0/Favicon.png',
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'Ver Catálogo',
        icon: 'https://i.ibb.co/BKdsNcw0/Favicon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('REDE POP', options)
  );
});
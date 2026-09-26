// Service Worker for МИФИ Планировщик PWA
const CACHE_VERSION = 'mifi-v2.1';
const CACHE_ASSETS = [
    './',
    './schedule_app_v2.1.html',
    './tf2-notification-sound.mp3',
    './fonts/NauryzRedKeds.ttf',
    './fonts/galiver-sans-bold.ttf',
    './fonts/muller-extrabold.ttf'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_VERSION).then((cache) => {
            console.log('[SW] Caching app shell');
            return cache.addAll(CACHE_ASSETS.map(url => new Request(url, {cache: 'reload'})));
        }).catch(err => {
            console.log('[SW] Cache failed:', err);
        })
    );
    self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_VERSION) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            if (response) {
                return response;
            }
            return fetch(event.request).then((response) => {
                // Cache successful responses
                if (response && response.status === 200) {
                    const responseToCache = response.clone();
                    caches.open(CACHE_VERSION).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            }).catch(() => {
                // Offline fallback
                return new Response('Оффлайн режим', {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: new Headers({
                        'Content-Type': 'text/plain'
                    })
                });
            });
        })
    );
});
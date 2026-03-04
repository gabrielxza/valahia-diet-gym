// Incrementa questo numero ad ogni update dell'app!
const CACHE_VERSION = 'v14';
const CACHE_NAME = `valahia-gym-${CACHE_VERSION}`;

const urlsToCache = [
    '/valahia-diet-gym/',
    '/valahia-diet-gym/index.html',
    '/valahia-diet-gym/style.css',
    '/valahia-diet-gym/app.js',
    '/valahia-diet-gym/manifest.json',
    '/valahia-diet-gym/icon-192.png',
    '/valahia-diet-gym/icon-512.png'
];

// Install Service Worker - Skip Waiting per update immediato
self.addEventListener('install', (event) => {
    console.log('🔄 Service Worker installing...', CACHE_NAME);

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('✅ Cache aperta:', CACHE_NAME);
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                // Force activate immediatamente senza aspettare
                return self.skipWaiting();
            })
    );
});

// Activate - Clean old caches + Claim clients
self.addEventListener('activate', (event) => {
    console.log('⚡ Service Worker activating...', CACHE_NAME);

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME) {
                            console.log('🗑️ Elimino cache vecchia:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                // Prendi controllo di tutte le pagine immediatamente
                return self.clients.claim();
            })
            .then(() => {
                // Notifica tutte le pagine che c'è un update
                return self.clients.matchAll().then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'SW_UPDATED',
                            version: CACHE_VERSION
                        });
                    });
                });
            })
    );
});

// Fetch - Network First per HTML/API, Cache First per assets
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip external requests (Google APIs, etc.)
    if (!url.origin.includes(self.location.origin) &&
        !url.origin.includes('netlify.app')) {
        return;
    }

    // Network First per HTML (sempre aggiornato)
    if (event.request.destination === 'document' ||
        url.pathname.endsWith('.html') ||
        url.pathname === '/') {

        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Aggiorna cache con nuova versione
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    // Se offline, usa cache
                    return caches.match(event.request);
                })
        );
        return;
    }

    // Network First per JS/CSS (aggiornamenti immediati), fallback cache se offline
    event.respondWith(
        fetch(event.request)
            .then(response => {
                if (response && response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});

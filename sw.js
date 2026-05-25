// ============================================
// ALVACOA Service Worker v4.0
// Cache + Hors-ligne + Notifications
// ============================================

const CACHE_NAME = 'alvacoa-cache-v4';
const DYNAMIC_CACHE = 'alvacoa-dynamic-v4';

// Ressources à mettre en cache immédiatement
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/modules.js',
    '/api-portal.js',
    '/ui.js',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/screenshot.png'
];

// ============ INSTALLATION ============
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installation v4.0');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Mise en cache des ressources...');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                console.log('✅ Installation terminée');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('❌ Erreur installation:', error);
            })
    );
});

// ============ ACTIVATION ============
self.addEventListener('activate', (event) => {
    console.log('🚀 Service Worker: Activation v4.0');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE) {
                            console.log('🗑️ Suppression ancien cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Activation terminée');
                return self.clients.claim();
            })
    );
});

// ============ INTERCEPTION DES REQUÊTES ============
self.addEventListener('fetch', (event) => {
    const { request } = event;
    
    // Ignorer les requêtes non GET
    if (request.method !== 'GET') return;
    
    // Ignorer les requêtes chrome-extension
    if (request.url.startsWith('chrome-extension://')) return;
    
    // Stratégie : Cache First, puis Network, puis cache dynamique
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                // Retourner le cache si trouvé
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Sinon, aller sur le réseau
                return fetch(request)
                    .then((networkResponse) => {
                        // Mettre en cache les réponses valides
                        if (networkResponse && networkResponse.ok) {
                            const responseClone = networkResponse.clone();
                            caches.open(DYNAMIC_CACHE)
                                .then((cache) => {
                                    cache.put(request, responseClone);
                                });
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Page hors-ligne pour les navigations
                        if (request.mode === 'navigate') {
                            return caches.match('/');
                        }
                        // Pour les images, retourner un placeholder
                        if (request.destination === 'image') {
                            return new Response(
                                `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
                                    <rect width="200" height="200" fill="#1e293b" rx="20"/>
                                    <text x="100" y="100" text-anchor="middle" fill="#6366f1" font-size="40" font-family="Arial">📷</text>
                                </svg>`,
                                { headers: { 'Content-Type': 'image/svg+xml' } }
                            );
                        }
                        // Erreur par défaut
                        return new Response('Ressource non disponible hors-ligne', { status: 503 });
                    });
            })
    );
});

// ============ NOTIFICATIONS PUSH ============
self.addEventListener('push', (event) => {
    console.log('📬 Notification push reçue');
    
    let data = {
        title: 'ALVACOA',
        body: 'Nouveau message reçu !',
        icon: 'icon-192.png',
        badge: 'icon-192.png',
        vibrate: [200, 100, 200],
        data: { url: '/' },
        actions: [
            { action: 'open', title: 'Ouvrir' },
            { action: 'close', title: 'Fermer' }
        ]
    };

    if (event.data) {
        try {
            const pushData = event.data.json();
            data = { ...data, ...pushData };
        } catch (e) {
            data.body = event.data.text();
        }
    }

    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: data.icon,
            badge: data.badge,
            vibrate: data.vibrate,
            data: data.data,
            actions: data.actions,
            requireInteraction: true,
            tag: 'alvacoa-msg',
            renotify: true
        })
    );
});

// ============ CLIC SUR NOTIFICATION ============
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'close') return;
    
    event.waitUntil(
        clients.matchAll({ type: 'window' })
            .then((clientList) => {
                // Chercher un onglet déjà ouvert
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Sinon, ouvrir un nouvel onglet
                return clients.openWindow(event.notification.data?.url || '/');
            })
    );
});

// ============ MESSAGING ============
self.addEventListener('message', (event) => {
    console.log('📨 Message reçu:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHES') {
        event.waitUntil(
            caches.keys().then((names) => {
                return Promise.all(names.map((name) => caches.delete(name)));
            })
        );
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0]?.postMessage({ version: '4.0', cache: CACHE_NAME });
    }
});

// ============ SYNCHRONISATION ============
self.addEventListener('sync', (event) => {
    console.log('🔄 Sync en arrière-plan:', event.tag);
    
    if (event.tag === 'sync-messages') {
        event.waitUntil(
            Promise.resolve(console.log('✅ Messages synchronisés'))
        );
    }
});

console.log('🧠 ALVACOA Service Worker v4.0 chargé');
console.log('📦 Cache:', CACHE_NAME);
console.log('🔔 Push:', 'PushManager' in self ? '✅' : '❌');
console.log('🔄 Sync:', 'SyncManager' in self ? '✅' : '❌');

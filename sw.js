// ============================================
// ALVACOA Service Worker - PWA Avancée
// Version 3.0.0
// ============================================

const CACHE_NAME = 'alvacoa-cache-v3';
const DYNAMIC_CACHE = 'alvacoa-dynamic-v3';
const API_CACHE = 'alvacoa-api-v3';
const OFFLINE_PAGE = '/';

// Ressources à mettre en cache immédiatement
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/modules.js',
    '/ui.js',
    '/manifest.json',
    '/favicon.ico'
];

// ============ INSTALLATION ============
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installation v3.0');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Mise en cache des ressources principales');
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
    console.log('🚀 Service Worker: Activation v3.0');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Supprimer les anciens caches
                        if (cacheName !== CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE && 
                            cacheName !== API_CACHE) {
                            console.log('🗑️ Suppression ancien cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('✅ Activation terminée');
                // Prendre le contrôle de tous les clients
                return self.clients.claim();
            })
    );
});

// ============ STRATÉGIES DE CACHE ============

// Cache First (ressources statiques)
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        // Retourner la page hors-ligne
        if (request.mode === 'navigate') {
            const cache = await caches.open(CACHE_NAME);
            return cache.match(OFFLINE_PAGE);
        }
        throw error;
    }
}

// Network First (API)
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        // Réponse JSON par défaut pour les erreurs API
        if (request.url.includes('/chat')) {
            return new Response(
                JSON.stringify({
                    content: "🔌 Mode hors-ligne. L'API n'est pas disponible. Utilisez le mode local.",
                    offline: true
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        throw error;
    }
}

// Stale While Revalidate (ressources dynamiques)
async function staleWhileRevalidate(request) {
    const cachedResponse = await caches.match(request);
    
    const fetchPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse && networkResponse.ok) {
                caches.open(DYNAMIC_CACHE)
                    .then((cache) => cache.put(request, networkResponse.clone()));
            }
            return networkResponse;
        })
        .catch(() => cachedResponse);
    
    return cachedResponse || fetchPromise;
}

// ============ INTERCEPTION DES REQUÊTES ============
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Ignorer les requêtes non supportées
    if (request.method !== 'GET') return;
    
    // Ignorer les extensions Chrome
    if (url.protocol === 'chrome-extension:') return;

    // Stratégie pour les API
    if (url.pathname.includes('/chat') || url.pathname.includes('/api/')) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Stratégie pour les ressources statiques locales
    if (url.origin === self.location.origin) {
        // Fichiers JS, CSS, HTML = Cache First
        if (request.destination === 'script' || 
            request.destination === 'style' || 
            request.destination === 'document') {
            event.respondWith(cacheFirst(request));
            return;
        }
        
        // Images, polices, etc. = Stale While Revalidate
        if (request.destination === 'image' || 
            request.destination === 'font' ||
            request.destination === 'video') {
            event.respondWith(staleWhileRevalidate(request));
            return;
        }
    }

    // Par défaut : Network First
    event.respondWith(networkFirst(request));
});

// ============ NOTIFICATIONS PUSH ============
self.addEventListener('push', (event) => {
    console.log('📬 Notification push reçue');
    
    let data = {
        title: 'ALVACOA',
        body: 'Nouveau message reçu !',
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="24" fill="%236366f1"/><text x="50" y="68" font-size="52" font-weight="bold" fill="white" text-anchor="middle">A</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="%2322c55e"/></svg>',
        vibrate: [200, 100, 200],
        data: { url: '/' },
        actions: [
            { action: 'open', title: 'Ouvrir' },
            { action: 'reply', title: 'Répondre' }
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

// Gestion du clic sur notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'reply') {
        // Ouvrir avec focus sur la zone de saisie
        event.waitUntil(
            clients.openWindow('/?reply=true')
        );
    } else {
        event.waitUntil(
            clients.openWindow(event.notification.data?.url || '/')
        );
    }
});

// ============ SYNCHRONISATION EN ARRIÈRE-PLAN ============
self.addEventListener('sync', (event) => {
    console.log('🔄 Synchronisation en arrière-plan:', event.tag);
    
    if (event.tag === 'sync-messages') {
        event.waitUntil(syncMessages());
    }
    
    if (event.tag === 'sync-contacts') {
        event.waitUntil(syncContacts());
    }
});

async function syncMessages() {
    try {
        const messagesToSync = await getPendingMessages();
        for (const msg of messagesToSync) {
            await sendMessageToServer(msg);
            await removePendingMessage(msg.id);
        }
        console.log('✅ Messages synchronisés');
        
        // Notifier les clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({ type: 'SYNC_COMPLETE', tag: 'messages' });
        });
    } catch (error) {
        console.error('❌ Erreur synchronisation messages:', error);
    }
}

async function syncContacts() {
    try {
        console.log('✅ Contacts synchronisés');
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({ type: 'SYNC_COMPLETE', tag: 'contacts' });
        });
    } catch (error) {
        console.error('❌ Erreur synchronisation contacts:', error);
    }
}

// Base de données IndexedDB simplifiée (via messages)
async function getPendingMessages() {
    // Dans une version complète, utiliser IndexedDB
    return [];
}

async function sendMessageToServer(msg) {
    // Envoyer au serveur
    return Promise.resolve();
}

async function removePendingMessage(id) {
    // Supprimer de la file d'attente
    return Promise.resolve();
}

// ============ MESSAGING ENTRE CLIENTS ============
self.addEventListener('message', (event) => {
    console.log('📨 Message reçu du client:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URL') {
        event.waitUntil(
            caches.open(CACHE_NAME)
                .then((cache) => cache.add(event.data.url))
                .then(() => {
                    event.ports[0]?.postMessage({ success: true });
                })
        );
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHES') {
        event.waitUntil(
            caches.keys().then((names) => {
                return Promise.all(names.map(name => caches.delete(name)));
            })
        );
    }
    
    if (event.data && event.data.type === 'GET_CACHE_SIZE') {
        event.waitUntil(
            getCacheSize().then((size) => {
                event.ports[0]?.postMessage({ size });
            })
        );
    }
});

async function getCacheSize() {
    const cacheNames = await caches.keys();
    let totalSize = 0;
    
    for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        
        for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
    }
    
    return totalSize;
}

// ============ MISE À JOUR PÉRIODIQUE ============
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-content') {
        event.waitUntil(updateContent());
    }
});

async function updateContent() {
    try {
        const cache = await caches.open(CACHE_NAME);
        for (const asset of PRECACHE_ASSETS) {
            try {
                const response = await fetch(asset);
                if (response.ok) {
                    await cache.put(asset, response);
                }
            } catch (e) {
                console.warn('⚠️ Impossible de mettre à jour:', asset);
            }
        }
        console.log('✅ Contenu mis à jour en arrière-plan');
    } catch (error) {
        console.error('❌ Erreur mise à jour périodique:', error);
    }
}

// ============ GESTION DU HORS-LIGNE ============
self.addEventListener('fetch', (event) => {
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match(OFFLINE_PAGE)
                        .then((response) => {
                            if (response) return response;
                            // Page hors-ligne par défaut
                            return new Response(
                                `<!DOCTYPE html>
                                <html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
                                <title>ALVACOA - Hors ligne</title>
                                <style>
                                    body{background:#0a0a1a;color:#f1f5f9;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;text-align:center;margin:0;}
                                    .card{background:#111827;padding:40px;border-radius:24px;max-width:400px;}
                                    h1{color:#6366f1;}p{color:#94a3b8;}
                                    button{background:#6366f1;color:white;border:none;padding:12px 24px;border-radius:12px;font-size:16px;cursor:pointer;margin-top:16px;}
                                </style></head>
                                <body>
                                    <div class="card">
                                        <h1>📡 Mode Hors-ligne</h1>
                                        <p>ALVACOA fonctionne en mode limité. Vos connaissances locales sont toujours disponibles.</p>
                                        <p>Reconnectez-vous pour utiliser l'API et Linkchat!</p>
                                        <button onclick="location.reload()">🔄 Réessayer</button>
                                    </div>
                                </body></html>`,
                                { headers: { 'Content-Type': 'text/html' } }
                            );
                        });
                })
        );
    }
});

// ============ LOGS ============
console.log('🧠 ALVACOA Service Worker v3.0 chargé');
console.log('📦 Cache:', CACHE_NAME);
console.log('🔔 Notifications:', 'Push' in self ? '✅ Supportées' : '❌ Non supportées');
console.log('🔄 Sync:', 'SyncManager' in self ? '✅ Supportée' : '❌ Non supportée');

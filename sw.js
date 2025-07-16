const CACHE_NAME = 'haekelmuster-pwa-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Dateien, die gecacht werden sollen
const urlsToCache = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/app.js',
  '/js/pwa.js',
  '/js/db.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json',
  '/offline.html',
  '/css/offline.css'
];

// Service Worker Installation
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Installation successful');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Service Worker Aktivierung
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activation successful');
      return self.clients.claim();
    })
  );
});

// Fetch Event - Caching Strategy
self.addEventListener('fetch', (event) => {
  // Nur GET-Requests cachen
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Cache miss - fetch from network
        return fetch(event.request)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            // Add to cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Network failed, show offline page
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Background Sync für Offline-Funktionalität
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Hier können Daten synchronisiert werden
      syncOfflineData()
    );
  }
});

async function syncOfflineData() {
  try {
    // Implementiere Sync-Logik hier
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push-Benachrichtigungen
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Zeit für dein Häkelprojekt!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open-app',
        title: 'App öffnen',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'dismiss',
        title: 'Später',
        icon: '/icons/icon-96x96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Häkelmuster PWA', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open-app') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Message Handler für Client-Kommunikation
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic Background Sync (für Erinnerungen)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'crochet-reminder') {
    event.waitUntil(
      showCrochetReminder()
    );
  }
});

async function showCrochetReminder() {
  const registration = await self.registration;
  
  registration.showNotification('Häkel-Erinnerung! 🧶', {
    body: 'Zeit für dein Häkelprojekt! Schaue dir deine gespeicherten Muster an.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'crochet-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'open-app',
        title: 'App öffnen'
      },
      {
        action: 'snooze',
        title: 'Später erinnern'
      }
    ]
  });
}

const CACHE_NAME = 'taskmaster-v1';

// רשימת הקבצים שהדפדפן ישמור לשימוש אופליין
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  // קבצי ה-JS וה-CSS יתווספו אוטומטית בזמן הריצה (Fetch)
];

// התקנה: שומר את הקבצים הבסיסיים במטמון
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// הפעלה: מנקה מטמון ישן אם עדכנו גרסה
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// אסטרטגיית "Cache First": מנסה להביא מהמטמון, אם אין - הולך לרשת
self.addEventListener('fetch', (event) => {
  // אנחנו לא רוצים לשמור במטמון בקשות ל-API (כי ה-Dexie מטפל בזה)
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response; // נמצא במטמון
      }
      return fetch(event.request).then((networkResponse) => {
        // שומר קבצים חדשים (כמו ה-bundle של ה-JS) במטמון תוך כדי תנועה
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
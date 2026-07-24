const CACHE_NAME = 'phonote-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/js/data.js',
  '/js/ui.js',
  '/js/utils.js',
  '/js/references.js',
  '/js/schemes.js',
  '/js/equipment.js',
  '/js/cheatsheets.js',
  '/js/filters.js',
  '/js/settings.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-144.png',
  '/icons/icon-96.png',
  '/icons/icon-72.png',
  '/icons/icon-48.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Кешируем файлы...');
        return cache.addAll(ASSETS).catch(err => {
          console.warn('⚠️ Некоторые файлы не закешированы:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Пропускаем запросы к API и аналитике
  if (event.request.url.includes('google-analytics') || 
      event.request.url.includes('analytics') ||
      event.request.url.includes('api/')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) {
          return cached;
        }
        return fetch(event.request)
          .then(response => {
            // Не кешируем неправильные ответы
            if (!response || response.status !== 200) {
              return response;
            }
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              try {
                cache.put(event.request, clone);
              } catch (e) {
                console.warn('⚠️ Не удалось закешировать:', event.request.url);
              }
            });
            return response;
          })
          .catch(() => {
            // Если файл не найден в кеше и офлайн, возвращаем страницу
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            return new Response('📸 PhotoNote офлайн', {
              status: 200,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

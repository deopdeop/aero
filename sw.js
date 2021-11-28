self.addEventListener('activate', event => {
    event.waitUntil((async function() {
        if (self.registration.navigationPreload) {
            console.log('Preload enabled')
            await self.registration.navigationPreload.enable();
        }
    })());
});

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
      caches.open('v1').then(cache => {
          console.log(cache);
      })
    );
  });

self.addEventListener('fetch', event => {
    console.log(event.request.url);
    event.respondWith(async () => {
        try {
            const response = await event.preloadResponse;
            if (response)
                return response
            else
                response = await fetch(event.request);
            
            console.log(response);
        } catch (e) {
            console.warn(e);
        }
    });
});
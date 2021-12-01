self.addEventListener('install', event => {
  console.log('Installed', event);

  // Don't wait for the old service workers
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Activated', event);

  // FIXME: Breaks on chromium
  /*
  event.waitUntil((async function() {
    if (self.registration.navigationPreload)
      await self.registration.navigationPreload.enable();
  })());
  */

  // Use the service worker immediately instead of after reload
  event.waitUntil(self.clients.claim());
});

let ctx;

self.addEventListener('message', event => {
  ctx = { url: { origin: event.data } };
})

// TODO: Remove all of the rewriters from the mutation observer since they won't be needed only href is needed
addEventListener('fetch', event => {
  console.log`Fetched ${event.request.url} for ${event.request.mode}`;

  // TODO: Rewrite url and body

  // TODO: Rewrite and copy ctx.headers
  console.log(event.request.headers);

  event.respondWith(async function() {
    let response = await event.preloadResponse;
    if (response)
      console.log('Preloaded response found using it')

    //response ??= fetch(event.request);
    response ??= fetch(rewrite.url(event.request.url.split(location.origin)[1]));

    console.log(response);

    return response;
  }());
});
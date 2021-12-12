'use strict'

let rewrite = {
  url: url => {
    if (url.startsWith('data:'))
      return url;
    if (url.startsWith('./'))
      url = url.splice(2);

    if (url.startsWith('http')) {
      return `${location.origin}/service/${url}`;
    } else {
      return `${location.origin}/service/${context.url.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    }
  },
};

self.addEventListener('install', event => {
  console.log('Installed', event);

  // Don't wait for the old service workers
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Activated', event);

  // FIXME: Breaks on chromium
  event.waitUntil((async function() {
    if (self.registration.navigationPreload)
      await self.registration.navigationPreload.enable();
  })());

  // Use the service worker immediately instead of after reload
  event.waitUntil(self.clients.claim());
});

let context = {};

self.addEventListener('message', event => {
  /*
  TODO
      - Allow for multiple sites to work at a time use context[INSERT CLIENT ID]
      - Only allow the top level document establish a context
      - Add and rewrite every cookie from set cookie headers using the cookie store api
  */
  context = {
      url: {
          origin: event.data
      }
  };
})

// TODO: Remove all of the rewriters from the mutation observer since they won't be needed only href is needed
self.addEventListener('fetch', event => {
  console.log`Fetched ${event.request.url.href} for ${event.request.mode}`;

  console.log(event.request.headers);

  event.waitUntil(async function() {
    /*
    FIXME: Wait for context before sending request
    TODO
        - Detect the caller
        - Rewrite
        - Attach cors headers to the response and request
    */
    let {
      body
    } = await event.preloadResponse || await fetch(rewrite.url(event.request.url.split(location.origin)[1]));

    console.log(body);

    return body;
  }());
});

/*
Only works on chromium with a secure context
https://caniuse.com/cookie-store-api
https://developers.google.com/web/updates/2018/09/asynchronous-access-to-http-cookies
https://wicg.github.io/cookie-store/#cookiestore
TODO
    - Provide a fallback in index.js
    - Archive original data
*/
self.addEventListener('cookiechange', (event) => {
  console.log('Change in cookie', event);

  for (const cookie of event.deleted) {
    console.log('Deleted a cookie', cookie);
  }
});

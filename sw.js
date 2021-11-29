self.addEventListener('activate', event => {
  event.waitUntil((async function() {
    if (self.registration.navigationPreload)
      await self.registration.navigationPreload.enable();
  })());
});

self.addEventListener('install', event => self.skipWaiting());

let allowResource = {
  // TODO: Comply with standards
  'Access-Control-Allow-Origin': url => ctx.cors['Access-Control-Allow-Origin'] ? ctx.cors['Access-Control-Allow-Origin'].includes(new URL(url).origin) : true,
  // https://fetch.spec.whatwg.org/#cross-origin-resource-policy-header
  'Cross-Origin-Resource-Policy': (url, embedderPolicyValue, response, forNavigation) => {
    // https://html.spec.whatwg.org/multipage/origin.html#same-origin
    let sameOrigin = ctx.url.origin === url.origin;
    // https://html.spec.whatwg.org/multipage/origin.html#schemelessly-same-site
    // TODO: Create a function for getting the domain from a subdomain
    let schemelesslySameSite = ctx.url.hostname.split('.').slice(-2).join('.') === url.hostname.split('.').slice(-2).join('.');

    // Step 1
    if (forNavigation && embedderPolicyValue === 'unsafe-none') return 'allowed'
    // Step 2
    policy = ctx.cors['Cross-Origin-Resource-Policy'];
    // Step 3
    if (policy === 'same-origin' || policy === 'same-site' || policy === 'cross-origin') {
      policy = null;
    }
    // Step 4
    if (policy === null) {
      switch (embedderPolicyValue) {
        case 'unsafe-none':
        case 'credentialless':
          if ( /* TODO: if response includes credentials ||*/ forNavigation)
            policy = 'same-origin';
        case 'require-corp':
          policy = 'same-origin'
      }
    }
    // Step 5
    switch (policy) {
      case null:
        return 'allowed'
      case 'cross-origin':
        return 'allowed'
      case 'same-origin':
        if (sameOrigin)
          return 'allowed';
        else
          return 'blocked';
      case 'same-site':
        if (schemelesslySameSite && ctx.url.scheme == 'https' || ctx.url.scheme !== 'https') {
          return 'allowed';
        } else {
          return 'blocked';
        }
    }
  }
};

self.addEventListener('fetch', event => {
  console.log(event.request.url);
  event.respondWith(async () => {
    let response = await event.preloadResponse;
    response ??= await fetch(event.request);

    console.log(response);
  });
});

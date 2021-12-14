'use strict'

let rewrite = {
    url: url => {
        if (url.startsWith('data:'))
            return url;
        else if (url.startsWith('./'))
            url = url.splice(2);

        return location.origin + contexts.http.prefix + url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ws://') || url.startsWith('wss://') ? contexts[event.clientId].origin + url.startsWith('/') ? '' : '/' : url;
    },
};

self.addEventListener('install', event => {
    // Don't wait for the old service workers
    self.skipWaiting();
});

// Use the service worker immediately instead of after reload
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const contexts = {};
self.addEventListener('message', event =>
    // Set the server ctx
    contexts[event.clientId] = {
        origin: event.data,
        http: {
            prefix: '/http/'
        }
    });

// TODO: Remove all of the rewriters from the mutation observer since they won't be needed only href is needed
self.addEventListener('fetch', event => {
    console.log`Fetched ${event.request.url.href} for ${event.request.mode}`;

    event.waitUntil(async () => {
        // Wait for context before sending request

		// Fetch the resource
        await fetch(rewrite.url(event.request.url.split(location.origin)[1])).then(response => {
			// Construct the rewitten response
			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers: response.headers
			});
		});
    })();
});

// Only works on chromium with a secure context
self.addEventListener('cookiechange', event => {
    console.log('Change in cookie', event);

    for (const cookie of event.deleted)
        console.log('Deleted a cookie', cookie);
});
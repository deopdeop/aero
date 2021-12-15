'use strict'

self.addEventListener('install', event => {
    // Don't wait for the old service workers
    self.skipWaiting();
});

// Use the service worker immediately instead of after reload
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const ctxs = {};
// Set the server ctx
self.addEventListener('message', event => ctxs[event.clientId] = event.data);

self.addEventListener('fetch', event => {
    console.log`Fetched ${event.request.url.href} for ${event.request.mode}`;

    event.waitUntil(async () => {
        // Wait for context before sending request

        // Fetch the resource
        await fetch(rewrite.url(event.request.url.split(location.origin)[1])).then(response => {
            // https://www.w3.org/TR/CSP3/#parse-response-csp
            const directives = {};
            const tokens = ctxs[event.clientId].csp;
            for (let i = 0; i < directiveTokens.length; i++) {
                const token = tokens[i].trim();

                const parts = token.match(/\S+/g);
                if (Array.isArray(parts)) {
                    const name = parts[0].toLowerCase();

                    if (name in directives || !name.endsWith('-src')) continue;

                    const value = parts[1];
                    // Normalize and rewrite the value
                    
                    directives[name] = value;
                }
            }

            // Set the rewritten csp value

			// Reconstruct the response
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

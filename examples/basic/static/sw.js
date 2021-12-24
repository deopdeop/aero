'use strict'

importScripts('./rewrite.js');

// Don't wait for the old service workers
self.addEventListener('install', event => self.skipWaiting());

// Use the service worker immediately instead of after reload
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const ctxs = {};
// Set the server ctx
self.addEventListener('message', event => ctxs[event.clientId] = event.data);

self.addEventListener('fetch', event => {
	//console.log`Fetched ${event.request.url.href} for ${event.request.mode}`;
	console.log(event.request.mode);

	event.waitUntil(async () => {
		// Wait for context before sending request

		/*
		Rewrite request headers
		https://www.w3.org/TR/CSP3/#parse-response-csp
		*/
		const policy = {};
		const tokens = ctxs[event.clientId].csp;
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i].trim();

			const parts = token.match(/\S+/g);
			if (Array.isArray(parts)) {
				const name = parts[0].toLowerCase();

				if (name in directives || !name.endsWith('-src'))
					continue;

				const value = parts[1];
				// Normalize and rewrite the value

				policy[name] = value;
			}
		}

		// Fetch the resource
		{ body, status, statusText, headers } = await fetch(rewrite.url(event.request.url.split(location.origin)[1]));

		if (['application/javascript', 'application/x-javascript'].includes(headers['content-type'])) {
			// Scoping
			body = rewrite.js(body);
		}

		// Return the resource
		return new Response(body, {
			status: status,
			statusText: statusText,
			headers: headers
		});
	});
});

/*
Only supports chromium with a secure context
https://wicg.github.io/cookie-store/#typedefdef-cookielist]
*/
self.addEventListener('cookiechange', event => {
	for (const cookie of event.changed)
		console.log('Cookie changed', cookie);
	for (const cookie of event.deleted)
		console.log('Deleted a cookie', cookie);
});
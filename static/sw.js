'use strict'

importScripts('./rewrite.js')

// Don't wait for the old service workers
self.addEventListener('install', event => self.skipWaiting());

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
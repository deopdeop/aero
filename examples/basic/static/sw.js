'use strict';

importScripts('/utils.js')

// Don't wait for the old service workers
self.addEventListener('install', _ => self.skipWaiting());

// Use the service worker immediately instead of after reload.
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const ctxs = {};
// Set the server ctx.
self.addEventListener('message', event => ctxs[event.clientId] = event.data);

const firstRequest = true;
self.addEventListener('fetch', event => {
	event.respondWith(async function() {
		// Get mime type from headers
		const mimeType = event.request.headers.get('Content-Type').split(';')[0];

		await fetch(event.request.url.split(location.origin)[1]).then(resp => {
			// If a site is being resolved
			if (mimeType === 'text/html' && event.request.type !== 'navigate') {
				return new Response(`
				// Proxy Objects
				...

				// Update the url hash.
				addEventListener('hashchange', event => context.url = location.hash);
	
				// Clear history.
				history.replaceState({}, '');
	
				// Don't set the history.
				addEventListener('popstate', event => event.preventDefault());
	
				_window.document.write(${resp.text()})
				`, {
	
				})
			} else if (['application/javascript', 'application/x-javascript'].includes(mimeType))
				// Scope
				js(resp.text())
			else {
				// Proxy as normal
			}
		})	
	});
});

/*
self.addEventListener('fetch', event => {
	console.log(event);

	console.log(fetch(event.request.url.split(location.origin)[1]));
	
	event.waitUntil(_ => {
		// Wait for context before sending request

		// CORS emulation
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

		console.log("Fetching");
	
		{ body, statusText, headers } = await fetch(url(event.request.url.split(location.origin)[1]));

		if (['application/javascript', 'application/x-javascript'].includes(headers['content-type']))
			// Scoping
			body = js(body);

		// Return the resource.
		return new Response(body, {
			statusText: statusText,
			headers: headers
		});
	});
});
*/

/*
Only supports chromium with the flag enable-experimental-cookie-features and a secure context
https://wicg.github.io/cookie-store/#typedefdef-cookielist
*/
self.addEventListener('cookiechange', event => {
	for (const cookie of event.changed) {
		console.log('Cookie changed', cookie);
	}
		
	for (const cookie of event.deleted) {
		console.log('Deleted a cookie', cookie);
	}
});
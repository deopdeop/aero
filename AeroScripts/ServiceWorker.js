'use strict'

//importScripts('./Utils.js');

import { RewriteUtil } from './utils.js';

// Don't wait for the old service workers
self.addEventListener('install', event => self.skipWaiting());

// Use the service worker immediately instead of after reload
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

const ctxs = {};
// Set the server ctx
self.addEventListener('message', event => {
	ctxs[event.clientId] = event.data;
});

self.addEventListener('fetch', event => {
	console.log(event.request.url.href);
	console.log(event.request.mode);

	event.waitUntil(async () => {
		// Wait for context before sending request


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

		/*
		// Fetch the resource.
		({ body, statusText, headers }) = await fetch(RewriteUtil.url(event.request.url.split(location.origin)[1]));

		if (['application/javascript', 'application/x-javascript'].includes(headers['content-type']))
			// Scoping
			body = RewriteUtil.js(body);

		// Return the resource.
		return new Response(body, {
			statusText: statusText,
			headers: headers
		});
		*/
	});
});

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
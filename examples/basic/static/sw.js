'use strict';

const config = {
	http: {
		prefix: '/http/'
	},
	ws: {
		prefix: '/ws/'
	},
	codec: 'plain'
};

import { scope } from './shared/scope.js';

// Don't wait for the old service workers
self.addEventListener('install', () => self.skipWaiting());

// Use the service worker immediately instead of after reload
self.addEventListener('activate', event => event.waitUntil(clients.claim()));

let delHeaders = ['cache-control', 'content-security-policy', 'content-length', 'content-encoding', 'cross-origin-opener-policy-report-only', 'cross-origin-opener-policy', 'report-to', 'strict-transport-security', 'x-frame-options', 'x-content-type-options'];
function filterHeaders(headers) {
	return Object.fromEntries([...headers].filter(([header]) => delHeaders.indexOf(header) === -1));
}

self.clientUrl = '';
self.origin = '';

self.addEventListener('fetch', event => {
	event.respondWith(async function() {
		const originSplit = event.request.url.split(location.origin);

		if (originSplit[originSplit.length - 1].startsWith('/aero/'))
			return fetch(event.request.url);

		if (event.request.destination === 'document') {
			var url = event.request.url;

			var origin = new URL(event.request.url.split(location.origin + ctx.http.prefix)[1]).origin;
			ctx.origin = origin;
		} else {
			const clients = await self.clients.matchAll({
				type: "window"
			}).then(function(clients) {
				for (var client of clients)
					if (client.id === event.clientId)
						clientUrl = client.url;
			});

			var origin = new URL(clientUrl.split(location.origin + ctx.http.prefix)[1]).origin;
			ctx.origin = origin;

			const prefixSplit = originSplit[originSplit.length - 1].split(ctx.http.prefix);

			const pUrl = prefixSplit[prefixSplit.length - 1];

			// CORS testing
			try {
				const controller = new AbortController();
				const signal = controller.signal;

				// This needs to be the actual url without /http/
				await fetch(null, {
					signal
				});

				// Don't actually send the request.
				controller.abort()
			} catch (err) {
				if (err.name !== 'AbortError')
					// Report CORS error
					throw new Error`Blocked cross origin request to ${url}`;
			}

			if (pUrl.startsWith('data:'))
				return fetch(event.request.url);
			else {
				var url = location.origin + ctx.http.prefix;

				if (originSplit.length === 1) {
					url += originSplit[0];
				} else {

					// If the url is already valid then don't do anything
					if (prefixSplit.length === 2 && prefixSplit[1].startsWith(url)) {
						url += prefixSplit[1];
					}
					else {
						// Use regex
						const protocolSplit = pUrl.startsWith('https:/') ? pUrl.split('https:/') : pUrl.split('http:/');

						const pathSplit = protocolSplit[protocolSplit.length - 1].split('/' + new URL(origin).hostname);
						
						const path = pathSplit[pathSplit.length - 1];

						const dotSplit = path.split('/')[1].split('.');

						// If another origin
						if (dotSplit.length === 2 && protocolSplit.length === 3)
							url += 'https:/' + path;
						else
							url += origin + path;
					}
				}
			}
		}

		console.log(`%csw%c ${event.request.url} %c${event.request.destination} %c->%c ${url}`, 'color: dodgerBlue', '', 'color: yellow', 'color: mediumPurple', '');

		var response = await fetch(url, {
			body: event.request.body,
			headers: {
				...event.request.headers,
				_Referer: origin
			},
			method: event.request.method,
			// Don't cache
			cache: "no-store"
		});

		let text;
		if (event.request.mode === 'navigate' && event.request.destination === 'document') {
			text = await response.text();
			if (text === '')
				text = "Can't fetch site!";
			else
				text = `
					<!DOCTYPE html>
					<meta charset=utf-8>
					<!--Reset favicon-->
					<link href=data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII= rel="icon" type="image/x-icon"/>
					<script id=ctx type=application/json>${JSON.stringify(ctx)}</script>
					<script src=/aero/scope.js type=module></script>
					<script src=/aero/aero.js></script>
					<script src=/aero/window.js></script>
					${
						// When HTML parsing is introduced this will only scope scripts
						scope(text)
					}
				`; 
		} else if (event.request.destination === 'script')
			text = scope(await response.text());
		else
			text = response.body;

		return new Response(text, {
			//status: response.status,
			headers: filterHeaders(response.headers)
		});
	}());
});

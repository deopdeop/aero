'use strict'

let rewrite = {
	url: url => {
		if (url.startsWith('data:'))
			return url;
		if (url.startsWith('./'))
			url = url.splice(2);

    	// regex may be faster
		if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('https://')) {
			return `${location.origin}/service/${url}`;
		} else {
			return `${location.origin}/service/${ctx.url.origin}${url.startsWith('/') ? '' : '/'}${url}`;
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

	// Use the service worker immediately instead of after reload
	event.waitUntil(self.clients.claim());
});

let ctxs = {};

self.addEventListener('message', event => {
	// Set the server ctx
	ctxs = {
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
		// Wait for context before sending request

		let {
			body
		} = await event.preloadResponse || await fetch(rewrite.url(event.request.url.split(location.origin)[1]));

		console.log(body);

		return body;
	}());
});

// Only works on chromium with a secure context
self.addEventListener('cookiechange', (event) => {
	console.log('Change in cookie', event);

	for (const cookie of event.deleted) {
		console.log('Deleted a cookie', cookie);
	}
});
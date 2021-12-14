// Unsupported notice the proxy currently only supports chromium in a secure context; these restrictions will go away once the polyfills or fallbacks are implemented.
if (!(isSecureContext && 'serviceWorker' in navigator && 'cookieStore' in window)) {
	document.write('Your browser is unsupported try on a chromium based browser.');
	throw new Error('Your browser is unsupported.');
}

globalThis._window = {};

Object.defineProperty(_window, 'location', {
	get(target, prop) {
		return context.url[prop];
	}
});

Object.defineProperty(_window, 'origin', {
	get() {
		return context.url.origin;
	}
});

_window.WebSocket = new Proxy(WebSocket, {
	construct(target, args) {
		args[0] = rewrite.url(args[0]);
		return Reflect.construct(...args);
	}
});

_window.RTCPeerConnection.prototype = new Proxy(RTCPeerConnection.prototype, {
	construct(target, args) {
		if (args[1].urls.startsWith('turns:')) {
			args[1].username += `|${args[1].urls}`;
			args[1].urls = `turns:${location.host}`;
			return Reflect.apply(...args);
		} else if (args[1].urls.startsWith('stuns'))
			console.warn("STUN connections aren't supported!");
	}
});

// Make an proxy object named intercept for addEventListener that handles propogation and bubbles

addEventListener('beforeunload', event => {
	// Cancel the redirect
	event.preventDefault();

	// TODO: Redirect href with rewritten url

	// Needed for chrome
	event.returnValue = '';
});

addEventListener('hashchange', event => {
	// Update the url hash
	context.url = location.hash;
});

addEventListener('open', event => console.log(event));

addEventListener('storage', event => {
	// I finished his but github decided to DELETE my code
});

addEventListener('submit', event => console.log(event));

navigator.serviceWorker.register('/sw.js', {
		// The Allow-Service-Worker header must be set to /
		scope: '/',
		// Don't cache http requests
		updateViaCache: 'none'
	})
	.then(registration => {
		// Update service worker
		registration.update();

		// Share server data with the service worker
		const channel = new MessageChannel();
		registration.active.postMessage(ctx.url.origin, [chan.port2]);

		// Write the site's body after this script
		var script = document.getElementsByTagName('script');
		script[script.length - 1].insertAdjacentHTML("beforebegin", context.body);
	});

// Allow the service worker to send messages before the dom's content is loaded
navigator.serviceWorker.startMessages();
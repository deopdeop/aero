// Unsupported notice the proxy currently only supports chromium in a secure context; these restrictions will go away once the polyfills or fallbacks are implemented.
if (!(isSecureContext && 'serviceWorker' in navigator && 'cookieStore' in window)) {
	document.write('Your browser is unsupported try on a chromium based browser.');
	throw new Error('Your browser is unsupported.');
}

ctx.csp = ctx.cors['Content-Security-Policy'];

new MutationObserver(mutations => {
	for (const mutation of mutations) {
		for (const node of mutation.addedNodes) {
			if (node instanceof HTMLScriptElement) {
				console.log(node.src, node.textContent);

				// Scope

				node.remove();
			} else if (node instanceof HTMLMetaElement) {
				if (node.httpEquiv.toLowerCase() == 'content-security-policy') {
					// https://html.spec.whatwg.org/multipage/semantics.html#attr-meta-http-equiv-content-security-policy
					if (!(node.parentElement instanceof HTMLHeadElement) || node.content === '')
						return;

					ctx.csp.push(node.content);
				}
			}
		}
	}
}).observe(document, {
	childList: true,
	subtree: true
});

globalThis.w = {};

Object.defineProperty(w, 'location', {
	get(target, prop) {
		return ctx.url[prop];
	}
});

Object.defineProperty(w, 'origin', {
	get() {
		return ctx.url.origin;
	}
});

w.WebSocket = new Proxy(WebSocket, {
	construct(target, args) {
		args[0] = ctx.ws.prefix + args[0];

		return Reflect.construct(...args);
	}
});

w.RTCPeerConnection.prototype = new Proxy(RTCPeerConnection.prototype, {
	construct(target, args) {
		// ICE over WS
		const ws = new WebSocket(ctx.ice.prefix)

		ws.send(JSON.stringify(args[0]));

		// Send fake object
	}
});

addEventListener('beforeunload', event => {
	// Cancel the redirect
	event.preventDefault();

	// Redirect
	event.redirect = ctx.http.prefix + document.activeElement.href;

	// Needed for chrome
	event.returnValue = '';
}, {
	capture: true
});

// Update the url hash
addEventListener('hashchange', event => context.url = location.hash);

// Clear history
history.replaceState({}, '');
// Don't set the history
addEventListener('popstate', event => event.preventDefault());

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
		const chan = new MessageChannel();
		registration.active.postMessage({
			cors: ctx.cors,
			origin: ctx.url.origin
		}, [chan.port2]);

		script[script.length - 1].insertAdjacentHTML("beforebegin", ctx.body);
	});

// Allow the service worker to send messages before the dom's content is loaded
navigator.serviceWorker.startMessages();

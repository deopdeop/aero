'use strict';

import { rewrite } from './utils.js';

if (!isSecureContext)
	throw new Error('Aero only supports secure contexts.');
else if (!('serviceWorker' in navigator))
	throw new Error('Aero requires navigator.serviceWorker support.');

if (!('cookieStore' in window)) {
	w.document = {
		cookie: {
			set: (target, prop) => {
				const directives = target[prop].split('; ');

				for (directive in directives) {
					const pair = directive.split('=');
					switch (pair) {
						case 'path':
					}
				}

				return directives.join('; ');
			}
		}
	}
}

ctx.csp = ctx.cors['Content-Security-Policy'];

let process = node => {
	if (node.href) {
		node.href = rewrite.url(node.href);
		node._href = node.href;
	}

	if (node instanceof HTMLScriptElement && node.textContent !== '') {
		// Create the new script.
		const script = document.createElement('script');
		script.type = 'application/javascript';
		script.text = rewrite.js(node.text);

		// Insert new script.
		node.parentNode.insertBefore(script, node.nextSibling);

		// Delete the old script.
		node.remove();
	}
	else if (
		node instanceof HTMLMetaElement &&
		// https://html.spec.whatwg.org/multipage/semantics.html#attr-meta-http-equiv-content-security-policy
		node.httpEquiv.toLowerCase() == 'content-security-policy' &&
		(node.parentElement instanceof HTMLHeadElement || node.content !== '')
	) {
		ctx.csp.push(node.content);
	}
};

let traverseNode = node => {
	let stack = [node];

	while(node = stack.pop) {
		if (node instanceof Text)
			continue;
		
		process(node);
		
		if (node.childNodes instanceof NodeList)
			for (let child of node.childNodes)
				stack.push(child);
	}
};

new MutationObserver(mutations => {
	for (let mutation of mutations)
		for (let node of mutation.addedNodes)
			traverseNode(node);
}).observe(document, {
	childList: true,
	subtree: true
});

let _window = {};

_window.document = {
	baseURI: {
		get: (target, prop) => ctx.url.origin
	},
	documentURI: {
		get: (target, prop) => ctx.url.origin
	}
}

_window.location = new Proxy(location, {
	get(target, prop){
		return ctx.url[prop];
	}
});

_window.origin = new Proxy(origin, {
	get() {
		return ctx.url.origin
	}
});

Object.defineProperty(_window, 'origin', {
	get() {
		return ctx.url.origin;
	}
});

_window.WebSocket = class WebSocket extends window.WebSocket {
	constructor(url, protocol) {
		url = ctx.ws.prefix + url;

		return Reflect.construct(...args);
	}
};

_window.RTCPeerConnection = class RTCPeerConnection extends EventTarget {
	constructor(config){
		super();

		this.socket = new WebSocket(ctx.ice.prefix)

		this.socket.addEventListener('open', () => {
			this.socket.send(JSON.stringify(config));
		});
	}
	close(){
		this.socket.close();
	}
};

// Update the url hash.
addEventListener('hashchange', event => context.url = location.hash);

// Clear history.
history.replaceState({}, '');
// Don't set the history.
addEventListener('popstate', event => event.preventDefault());

navigator.serviceWorker.register('/Aero$/sw.js', {
	// The Allow-Service-Worker header must be set to /.
	scope: '/',
	// Don't cache http requests.
	updateViaCache: 'none'
}).then(registration => {
	// Update service worker
	registration.update();

	// Share server data with the service worker.
	const chan = new MessageChannel();
	registration.active.postMessage({
		cors: ctx.cors,
		origin: ctx.url.origin
	}, [chan.port2]);

	// Insert the site's html after this scripts.
	const scripts = document.getElementsByTagName('script');
	scripts[scripts.length - 1].insertAdjacentHTML("beforebegin", ctx.body);
});

// Allow the service worker to send messages before the dom's content is loaded.
navigator.serviceWorker.startMessages();
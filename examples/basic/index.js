import { rewrite } from '/utils.js';

if (!isSecureContext)
	throw new Error('Aero only supports secure contexts.');
else if (!('serviceWorker' in navigator))
	throw new Error('Aero requires navigator.serviceWorker support.');

ctx.csp = ctx.cors['Content-Security-Policy'];

new MutationObserver(mutations => {
	for (let mutation of mutations)
		for (let node of mutation.addedNodes) {
			let stack = [node];

			while (node = stack.pop()) {
				if (node instanceof Text)
					continue;
				if (node.href) {
					console.log(node.href);

					//node.href = rewrite.url(node.href);
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
				} else if (
					node instanceof HTMLMetaElement &&
					// https://html.spec.whatwg.org/multipage/semantics.html#attr-meta-http-equiv-content-security-policy
					node.httpEquiv.toLowerCase() == 'content-security-policy' &&
					(node.parentElement instanceof HTMLHeadElement || node.content !== '')
				) {
					ctx.csp.push(node.content);
				}

				if (node.childNodes instanceof NodeList)
					for (let child of node.childNodes)
						stack.push(child);
			}
		}
}).observe(document, {
	childList: true,
	subtree: true
});

let _window = {};

/*
if (!('cookieStore' in window)) {
	_window.document = {
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

_window.WebSocket = class WebSocket extends WebSocket {
	constructor(url, protocol) {
		url = ctx.ws.prefix + url;

		return Reflect.construct(...args);
	}
};

_window.RTCPeerConnection = class RTCPeerConnection extends EventTarget {
	constructor(config){
		super();

		this.socket = new WebSocket(ctx.ice.prefix)

<<<<<<< HEAD
		this.socket.addEventListener('open', () => {
			this.socket.send(JSON.stringify(config));
		});
	}
	close(){
		this.socket.close();
	}
};
*/

// Update the url hash.
addEventListener('hashchange', event => context.url = location.hash);

// Clear history.
history.replaceState({}, '');
// Don't set the history.
addEventListener('popstate', event => event.preventDefault());

console.log('hi');
navigator.serviceWorker.register('/sw.js', {
	// Allow es6 imports to be used
	type: 'module',
	// The Allow-Service-Worker header must be set to /.
	scope: '/',
	// Don't cache http requests.
	updateViaCache: 'none'
}).then(registration => {
	console.log('registered');

	// Update service worker
	registration.update();

	// Share server data with the service worker.
	const chan = new MessageChannel();
	registration.active.postMessage({
		cors: ctx.cors,
		origin: ctx.url.origin
	}, [chan.port2]);

	// Insert the site's html after this script.
	const scripts = document.getElementsByTagName('script');
	scripts[scripts.length - 1].insertAdjacentHTML("beforebegin", ctx.body);
});

// Allow the service worker to send messages before the dom's content is loaded.
navigator.serviceWorker.startMessages();
=======
				// Send fake object
			}
		})
	};

	// Update the url hash.
	addEventListener('hashchange', event => context.url = location.hash);

	// Clear history.
	history.replaceState({}, '');
	// Don't set the history.
	addEventListener('popstate', event => event.preventDefault());

	addEventListener('submit', event => console.log(event));

	navigator.serviceWorker.register('/sw.js', {
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
}
>>>>>>> 600d0eb4df10fc6929406d26560e874b4569eaeb

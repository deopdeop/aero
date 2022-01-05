'use strict';

console.log(ctx);

ctx.csp = ctx.cors['Content-Security-Policy'];

function process(html) {

};
/*
new MutationObserver(mutations => {
	for (let mutation of mutations)
		for (let node of mutation.addedNodes) {
			let stack = [node];

			while (node = stack.pop()) {
				if (node instanceof Text)
					continue
	
				// Attribute rewriting
				if (node.href) {
					node.href = url(node.href);
					node._href = node.href;
				}
				if (node.action) {
					console.log(node);
					node.action = url(node.action);
					node._action = node.action;
				}

				if (node instanceof HTMLScriptElement && node.textContent !== '') {
					// Create the new script.
					const script = document.createElement('script');
					script.type = 'application/javascript';
					script.text = js(node.text, ctx.url.origin);

					// Insert new script.
					// This causes an infinite loop
					//node.parentNode.insertBefore(script, node.nextSibling);

					// Delete the old script
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
*/

let _window = {};

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
	get(target, prop) {
		return ctx.url[prop];
	}
});

/*
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
	constructor(config) {
		super();

		this.socket = new WebSocket(ctx.ice.prefix)

		this.socket.addEventListener('open', () => {
			this.socket.send(JSON.stringify(config));
		});
	}
	close() {
		this.socket.close();
	}
};
*/
// Isolate variables from script
{
	if (!isSecureContext) throw new Error('Aero only supports secure contexts.');
	else if (!('serviceWorker' in navigator)) throw new Error('Aero requires navigator.serviceWorker support.');

	ctx.csp = ctx.cors['Content-Security-Policy'];

	let process = node => {
		if (node.href) {
			node.href = rewrite.url(node.href);
			node.oldHref = node.href;
		}

		if (node instanceof HTMLScriptElement && node.textContent !== '') {
			// Create the new script.
			const script = document.createElement('script');
			script.type = 'application/javascript';
			script.text = node.text;

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
		)
			ctx.csp.push(node.content);
	};

	let traverseNode = node => {
		let stack = [node];

		while(node = stack.pop()) {
			if (node instanceof Text) continue;
			
			process(node);

			if (node.childNodes instanceof NodeList) for (let child of node.childNodes) {
				stack.push(child);
			}
		}
	};

	new MutationObserver(mutations => {
		for (let mutation of mutations) {
			for (let node of mutation.addedNodes) {
				traverseNode(node);
			}
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});

	let w = {};
	
	w.document = {
		baseURI: {
			get: (target, prop) => ctx.url.origin
		},
		documentURI: {
			get: (target, prop) => ctx.url.origin
		}
	}

	/*
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
	*/

	w.location = new Proxy(location, {
		get(target, prop){
			return ctx.url[prop];
		}
	});
	
	w.origin = new Proxy(origin, {
		get() {
			return ctx.url.origin
		}
	});

	w.WebSocket = new Proxy(WebSocket, {
		construct(target, args) {
			args[0] = ctx.ws.prefix + args[0];

			return Reflect.construct(...args);
		}
	});

	w.RTCPeerConnection = {
		prototype: new Proxy(RTCPeerConnection.prototype, {
			construct(target, args) {
				// ICE over WS
				const ws = new WebSocket(ctx.ice.prefix)

				ws.send(JSON.stringify(args[0]));

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

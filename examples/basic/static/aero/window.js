import { rewriteHTML } from './html.js';
import { scope } from '../scope.js';

const ctx = JSON.parse(document.getElementsByTagName("script")[0].innerHTML);

let fakeLocation = new URL(location.href.match(/(?<=\/http\/).*/g)[0]);

function wrap(url) {
	return ctx.http.prefix + url;
}

audio = new Proxy(audio, {
	construct(target, args) {
		[url] = args[0];

		if (url)
			url = wrap(url);

		return Reflect.construct(target, args);
	},
});

const writeHandler = {
    apply(target, that, args) {
        [markup] = args;

        return Reflect.apply(...arguments);
    }
};
document.prototype.write = new Proxy(Document.prototype.write, writeHandler);

Element.prototype.setAttribute = new Proxy(Element.prototype.setAttribute, {
    apply(target, that, args) {
        [name, value] = args;

        return Reflect.apply(...arguments);
    }
});

Element.prototype.setAttributeNS = new Proxy(Element.prototype.setAttributeNS, {
    apply(target, that, args) {
        [namespace, name, value] = args;

        return Reflect.apply(...arguments);
    }
});

const attrHandler = {
    apply(target, that, args) {
        [attr] = args;

        return Reflect.apply(...arguments);
    }
};
Element.prototype.setAttributeNode = new Proxy(Element.prototype.setAttributeNode, attrHandler);
Element.prototype.setAttributeNodeNS = new Proxy(Element.prototype.setAttributeNodeNS, attrHandler);

var historyState = {
	apply(target, that, args) {
		let [state, title, url = ''] = args;

		return Reflect.apply(...arguments);
	}
};
history.pushState = new Proxy(history.pushState, historyState);
history.replaceState = new Proxy(history.replaceState, historyState);

const locationProxy = new Proxy({}, {
	get(target, prop) {
		console.log`location.${prop}: ${fakeLocation[prop]}`;
		if (typeof target[prop] === 'function')
			return {
				assign: url => wrap(url),
				toString: url => fakeLocation.toString(),
				reload: location.reload
			}[prop];
		return fakeLocation[prop];
	},
	set(target, prop, value) {
		console.log`set location ${prop}: ${value}`;
		if (prop === 'href')
			location[prop] = ctx.http.prefix + fakeLocation.origin + value;
	}
})
$location = locationProxy;
document.location = locationProxy;

Node.prototype.textContent = new Proxy(Node.prototype.textContent, {
    set(target, prop, value) {
        if (Node.tagname === 'SCRIPT')
            value = rewrite(value);

        return Reflect.set(...arguments);
    }
});

Navigator.serviceWorker.register = new Proxy(Navigator.serviceWorker.register, {
	apply(target, that, args) {
		args[0] = wrap(args[0]);

		return Reflect.apply(...arguments);
	}
})

open = new Proxy(open, {
	apply(target, that, args) {
		if (args[0])
			args[0] = wrap(args[0]);

		return Reflect.apply(...arguments);
	}
});

postMessage = new Proxy(postMessage, {
	apply(target, that, args) {
		return Reflect.apply(...arguments);
	}
});

WebSocket = new Proxy(WebSocket, {
	construct(target, args) {
		[url] = args;

		const protocol = url.split('://')[0] + '://';
		url = 'ws://' + location.host + ctx.ws.prefix + url;

		return Reflect.construct(target, [url]);
	}
});

Worker = new Proxy(Worker, {
	construct(target, args) {
		return Reflect.construct(target, args);
	}
});

Object.defineProperty(document, 'domain', {
	get() {
		return fakeLocation.hostname;
	},
	set(value) {
		return value;
	}
});
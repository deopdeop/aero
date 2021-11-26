let rewrite = {
    css: str => {
        // TODO: Rewrite.
        return str
    },
    js: str => {
        return `
        (function (window) {
            ${str}
        }({ window, ..._window }));
        `
    },
    url: str => {
        // TODO: Instead rewrite the url to the file in the current directory.
        if (str.startsWith('./')) {
            str = str.slice(2);
        }

        const split = str.split(':');

        // TODO: Custom protocols; this would require rewrite _window proxies for navigator.registerProtocolHandler.
        if (split[0] === 'javascript') return `javascript:${rewrite.js(split[1])}`;
        else if (split[0] !== 'mailto') return `//${ctx.host}/${request.url.host}/${str}`;
    }
};

const _window = {
    document: {
        write: html => {
            let doc = new DOMParser().parseFromString(html, 'text/html');

            let walker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_ELEMENT);
            while (walker.nextNode()) {
                console.log(walker.currentNode.tagName);
                switch (walker.currentNode.tagName) {
                case 'SCRIPT':
                    if (walker.currentNode.innerText != "") walker.currentNode.innerText = rewrite.js(walker.currentNode.innerText);
                    break;
                case 'STYLE':
                    console.info(walker.currentNode.innerText);
                }
                // ? Is there a better alternative?
                walker.currentNode.getAttributeNames().forEach(name => {
                    console.log(name);

                    switch (name) {
                    case 'href':
                        walker.currentNode.setAttribute(name, rewrite.url(walker.currentNode.getAttributeNode(name).value));
                        break;  
                    case 'onclick':
                        walker.currentNode.setAttribute(name, rewrite.js(walker.currentNode.getAttributeNode(name).value));
                        break;
                    case 'src':
                        walker.currentNode.setAttribute(name, rewrite.url(walker.currentNode.getAttributeNode(name).value));
                        break;
                    }
                })
            }

            console.info(doc.documentElement.innerHTML);

            document.write(doc.documentElement.innerHTML);
        }
    },
    location: new Proxy(window.location, {
        get: (target, prop) => ctx.request.url[prop],
        set: (target, prop, value) => target[prop] = rewrite.url(value)
    }),
    // WebRTC browser support is undocumented!
    RTCPeerConnection: {
        prototype: new Proxy(window.RTCPeerConnection.prototype, {
            apply: (target, thisArg, args) => {
                if (args[1].urls.startsWith('turns:')) {
                    args[1].username += `|${args[1].urls}`;
                    args[1].urls = `turns:${location.host}`;
                    return Reflect.apply(...arguments);
                } else if (args[1].urls.startsWith('stuns')) console.warn("STUN connections aren't supported!");
            }
        })
    }
};
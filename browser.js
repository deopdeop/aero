let rewrite = {
    // TODO: Rewrite.
    css: str => str,
    js: str => {
        return `
        (function (window) {
            ${str}
        }({ window, ..._window }));
        `
    },
    url: str => {
        // TODO: Instead rewrite the url to the file in the current directory.
        if (str.startsWith('./'))
            str = str.slice(2);

        const split = str.split(':');

        // TODO: Custom protocols; this would require rewrite _window proxies for navigator.registerProtocolHandler.
        if (split[0] === 'javascript')
            return `javascript:${rewrite.js(split[1])}`;
        else if (split[0] !== 'mailto')
            return `//${ctx.host}/${ctx.request.url.origin}/${str}`;
    }
};

// Cors emulation
function allowRequest(url) {
    let allowRequest = true;
    // TODO: Support more CORS headers.
    if (ctx.request['Access-Control-Allow-Origin'] && ctx.request['Access-Control-Allow-Origin'].includes(new URL(args[0]).origin))
        allowRequest = false;
    return allowRequest;
}

try {
    var _window = {
        // Uncomment if on chrome, edge, or firefox with houdini flags on
        /*
        CSS: {
            paintWorklet: {
                // https://dev.to/adrianbdesigns/css-houdini-worklets-paint-api-and-font-metrics-api-mj4
                addModule: new Proxy(window.CSS.paintWorklet.addModule, {
                    apply: (target, thisArg, args) => {
                        if (args[0]) args[0] = rewrite.url(args[0]);
                        return Reflect.apply(...arguments);
                    }
                })
            }
        },
        */
        document: {
            write: str => {
                let doc = new DOMParser().parseFromString(str, 'text/html');

                let walker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_ELEMENT);
                while (walker.nextNode()) {
                    console.info(walker.currentNode.tagName);

                    switch (walker.currentNode.tagName) {
                        case 'IFRAME':
                            if (ctx.request['X-Frame-Options'][0] === "DENY") {
                                walker.currentNode.remove();
                                continue;
                            } else {
                                if (true) {
                                    walker.currentNode.remove();
                                    continue;
                                } else if (false) {
                                    walker.currentNode.remove();
                                    continue;
                                }
                            }
                            break;
                        case 'SCRIPT':
                            if (walker.currentNode.innerText != "")
                                walker.currentNode.innerText = rewrite.js(walker.currentNode.innerText);
                            break;
                        case 'STYLE':
                            console.info(walker.currentNode.innerText);
                            walker.currentNode.sheet.replace(rewrite.css(walker.currentNode.innerText));
                            console.info(walker.currentNode.innerText);
                    }
                    // TODO: Find a better alternative.
                    walker.currentNode.getAttributeNames().forEach(name => {
                        console.info(name);

                        switch (name) {
                            case 'href':
                                walker.currentNode.setAttribute(name, rewrite.url(walker.currentNode.getAttributeNode(name).value));
                                break;
                            case 'onclick':
                                walker.currentNode.setAttribute(name, rewrite.js(walker.currentNode.getAttributeNode(name).value));
                                break;
                            case 'src':
                                walker.currentNode.setAttribute(name, rewrite.url(walker.currentNode.getAttributeNode(name).value));
                            case 'style':
                                walker.currentNode.setAttribute(name, rewrite.css(walker.currentNode.getAttributeNode(name).value));
                        }
                    });
                }

                console.info(doc.documentElement.innerHTML);

                document.write(doc.documentElement.innerHTML);
            }
        },
        fetch: new Proxy(window.fetch, {
            apply: (target, thisArg, args) => {
                if (args[0] && allowRequest(args[0]))
                    args[0] = rewrite.url(args[0]);
                return Reflect.apply(args);
            }
        }),
        location: new Proxy(window.location, {
            get: (target, prop) => ctx.request.url[prop],
            set: (target, prop, value) => target[prop] = rewrite.url(value)
        }),
        RTCPeerConnection: {
            prototype: new Proxy(window.RTCPeerConnection.prototype, {
                apply: (target, thisArg, args) => {
                    if (args[1].urls.startsWith('turns:')) {
                        args[1].username += `|${args[1].urls}`;
                        args[1].urls = `turns:${location.host}`;
                        return Reflect.apply(...arguments);
                    } else if (args[1].urls.startsWith('stuns'))
                        console.warn("STUN connections aren't supported!");
                }
            })
        },
        XMLHttpRequest: {
            prototype: {
                open: new Proxy(window.XMLHttpRequest.prototype.open, {
                    apply: (target, thisArg, args) => {
                        if (args[1] && allowRequest(args[1]))
                            args[1] = rewrite.url(args[1])
                        return Reflect.apply(...arguments);
                    }
                })
            }
        }
    };
} catch (e) {
    console.warn(e);
}
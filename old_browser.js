let allowResource = {
    // TODO: Check credentials on xhr

    // TODO: Comply with standards
    'Access-Control-Allow-Origin': url => ctx.cors['Access-Control-Allow-Origin'] ? ctx.cors['Access-Control-Allow-Origin'].includes(new URL(url).origin) : true,
    // Possibly fetch only?
    // https://fetch.spec.whatwg.org/#cross-origin-resource-policy-header
    'Cross-Origin-Resource-Policy': url => {
        // embedderPolicyValue is Cross-Origin-Embedder-Policy
        let embedderPolicyValue = ctx.cors["Cross-Origin-Embedder-Policy"];
        // https://html.spec.whatwg.org/multipage/origin.html#same-origin
        let sameOrigin = ctx.url.origin === url.origin;
        // https://html.spec.whatwg.org/multipage/origin.html#schemelessly-same-site
        // TODO: Create a function for getting the domain from a subdomain
        let schemelesslySameSite = ctx.url.hostname.split('.').slice(-2).join('.') === url.hostname.split('.').slice(-2).join('.');
        // TODO: Properly set this value
        let forNavigation = true;

        // not done
        //if (forNavigation && embederPolicyValue)
        //...

        // Placeholder
        return true;
    }
};

let rewrite = {
    css: str => {
        // TODO: Rewrite.
        // https://drafts.css-houdini.org/css-typed-om/#urlimagevalue-serialization
        return str;
    },
    js: str => {
        return `
        (function (window) {
            ${str}
        }({ window, ..._window }));
        `
    },
    url: (str) => {
        // TODO: Standard compliancy.

        // TODO: Instead rewrite the url to the file in the current directory.
        if (str.startsWith('./'))
            str = str.slice(2);

        const split = str.split(':');

        // TODO: Custom protocols; this would require rewrite _window proxies for navigator.registerProtocolHandler.
        if (split[0] === 'javascript')
            return `javascript:${rewrite.js(split[1])}`;
        else if (split[0] !== 'mailto') {
            if (/^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/gm.test(str))
                return `${location.origin}/${str}`;
            else {
                if (str.startsWith('/'))
                    str = str.slice(1);
                return `${location.origin}/${ctx.url.origin}/${str}`;
            }
        }
    }
};

try {
    var _window = {
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
        // Instead proxify elements like alloy
        document: {
            write: str => {
                console.info(str);

                let doc = new DOMParser().parseFromString(str, 'text/html');

                let walker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_ELEMENT);
                while (walker.nextNode()) {
                    console.info(walker.currentNode.tagName);

                    switch (walker.currentNode.tagName) {
                        // TODO: Comply to standards and cite them
                        case 'IFRAME':
                            if (ctx.cors['X-Frame-Options'][0] === "DENY") {
                                walker.currentNode.remove();
                                continue;
                            } else {
                                // TODO: handle the other cors properties
                                if (false) {
                                    walker.currentNode.remove();
                                    continue;
                                } else if (false) {
                                    walker.currentNode.remove();
                                    continue;
                                }
                            }
                            break;
                        case 'SCRIPT':
                            console.info(walker.currentNode);
                            if (walker.currentNode.innerText != "")
                                walker.currentNode.innerText = rewrite.js(walker.currentNode.innerText);
                            break;
                        case 'STYLE':
                            console.info(walker.currentNode.innerText);
                            /*
                            To fix
                                *
                                    1. Copy the old stylesheet to a new one
                                    1. Rewrite css
                                    2. Delete the old stylesheet
                                    3. Add the new stylesheet
                                * > With the [Houdini CSS Typed Object Model](https://houdini.glitch.me/typed-om) you can change the css
                                    ...
                            */
                            //walker.currentNode.sheet.replace(rewrite.css(walker.currentNode.innerText));
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
                let url = new URL(args[0])
                // https://fetch.spec.whatwg.org/#cross-origin-resource-policy-header
                if (args[0] && allowResource['Access-Control-Allow-Origin'](url) && allowResource['Cross-Origin-Resource-Policy'](url))
                    return Reflect.apply(...arguments);
                else
                    return 
            }
        }),
        location: new Proxy(window.location, {
            get: (target, prop) => ctx.url[prop],
            set: (target, prop, value) => target[prop] = rewrite.url(value)
        }),
        navigator: {
            prototype: {

            }
        },
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
                        if (args[1] && allowResource['Access-Control-Allow-Origin'](new URL(args[1])))
                                args[1] = rewrite.url(args[1]);
                        return Reflect.apply(...arguments);
                    }
                })
            }
        }
    };
} catch (e) {
    console.warn(e);
}

console.info(_window);
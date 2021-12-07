'use strict'

// Unsupported notice currently only chromium in a secure context; these restrictions will go away once the polyfills or fallbacks are implemented
// TODO: These should probably be more descriptive since aero is releasing soon
if (!window.isSecureContext && 'serviceWorker' in navigator && 'cookieStore' in window) {
    document.write('Unsupported!');
    return;
}

/// <reference path="rewrite.ts"/>

rewrite = {
    script: body => `
{
  window.document.scripts = _window.document.scripts;
  _window = undefined;
    
  ${body}
}
  `,
    ...rewrite
}

// Scoping

// TODO: Conceal event listeners

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
// ...

// Interceptors

// TODO: Write a wrapper for these event listeners

// TODO: onstorage

// onBeforePrint would be cool for printer middleware lol

window.addEventListener('beforeunload', event => {
    // Cancel the redirect
    event.preventDefault();
    
    // TODO: Redirect href with rewritten url

    // Needed for chrome
    event.returnValue = '';
}, { capture: true });

window.addEventListener('hashchange', event => {
    // Update context.url hash property
    context.url = location.hash;
}, { capture: true });

// TODO: Rewrite websocket and webrtc messages
window.addEventListener('message', event => console.log(event), { capture: true });

// Move this to a privacy middleware if done
// TODO: Conceal history with window.onpopstate

// TODO: If the beforeunload event interceptor idea doesn't work for forms try SubmitEvent

navigator.serviceWorker.register('/sw.js', {
        // The Allow-Service-Worker header must be set to / for the scope to be allowed
        scope: context.path,
        // Don't cache http requests
        updateViaCache: 'none'
    })
    .then(registration => {
        // Update service worker
        registration.update();

        // Share server data with the service worker
        const channel = new MessageChannel();
        registration.active.postMessage(context.url.origin, [channel.port2]);

        // Write the site's body after this script
        // document.write is blocked when 2G connections are used on mobile chrome and if the document is loaded already it will create a new document so the html is inserted after the script
        var script = document.getElementsByTagName('script');
        script[script.length - 1].insertAdjacentHTML("beforebegin", context.body);
    });

// Allow the service worker to send messages before the dom's content is loaded
navigator.serviceWorker.startMessages();
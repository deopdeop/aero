globalThis.observerCallback = (mutations, observer) => {
  // BIG mess lol
  for (mutation of mutations) {
    for (node of mutation.addedNodes) {
      if (node instanceof Element) {
        if (node.children) {
          for (node of node.children)
            if (node instanceof Element) {
              for (node of node.children)
                if (node instanceof Element) {
                  if (node.tagName === "A" && node.href) {
                    node._href = node.href;
                    node.href = rewrite.url(node.href);
                  }
                }
            }
        }
      }
    }
  }
}
new MutationObserver(globalThis.observerCallback)
  .observe(
    document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true
    }
  );

navigator.serviceWorker.register('/sw.js', {
    // The Allow-Service-Worker header must be set to / for the scope to be allowed
    scope: '/',
    // Don't cache http requests
    updateViaCache: 'none'
  })
  .then(registration => {
    // Update service worker
    registration.update();

    // Share server data with the service worker
    const channel = new MessageChannel();
    registration.active.postMessage(ctx.url.origin, [channel.port2]);

    // Write the site's body after this script
    // document.write is blocked when 2G connections are used on chromium and if the document is loaded already it will create a new one so this is used instead
    var script = document.getElementsByTagName('script');
    script[script.length-1].insertAdjacentHTML("beforebegin", ctx.body);
  });

// TODO: Instead of overwritting window overwrite specific properties for performance in the self invoking function
globalThis._window = {};

Object.defineProperty(_window, 'document.cookie', {
  get(target, prop) {
    // TODO: Rewrite cookie
    return '';
  }
});

// This might not be needed; I am adding this just to be safe, remove if not needed
Object.defineProperty(_window, 'document.scripts', {
  get(target, prop) {
    // Hide the rewriter
    return target[prop - 1];
  }
});

Object.defineProperty(_window, 'location', {
  get(target, prop) {
    return ctx.url[prop];
  }
});

_window.WebSocket = new Proxy(WebSocket, {
  construct(target, args) {
    args[0] = rewrite.url(args[0]);

    return Reflect.construct(...arguments);
  }
});

_window.RTCPeerConnection = new Proxy(RTCPeerConnection, {
  construct(target, args) {
    if (args[1].urls.startsWith('turns:')) {
      args[1].username += `|${args[1].urls}`;
      args[1].urls = `turns:${location.host}`;

      return Reflect.apply(...arguments);
    } else if (args[1].urls.startsWith('stuns'))
      console.warn("STUN connections aren't supported!");
  }
});

// Privacy Middleware

if ('IdleDetector' in window && ctx.secure) {
  // https://wicg.github.io/idle-detection/#idl-index
  let UserIdleState;
  let ScreenIdleState;
  let IdleOptions;
  
  Object.defineProperty(_window.IdleDetection.prototype, 'requestPermission', {
    apply(target, thisArg, args) {
      UserIdleState = true;
      ScreenIdleState = true;

      // FIXME: Return promise
      return 'granted';
    }
  });
  
  Object.defineProperty(_window.IdleDetection.prototype, 'screenState', {
    get() {
      return UserIdleState;
    }
  });
  
  Object.defineProperty(_window.IdleDetection.prototype, 'start', {
    apply(target, thisArg, args) {
      IdleOptions = args[0];
    }
  });
  
  Object.defineProperty(_window.IdleDetection.prototype, 'userState', {
    get() {
      return UserIdleState;
    }
  });
}

// TODO: Create an indexdb entry of the information instead of storing it in browsing history
Object.defineProperty(_window, 'History.pushState', {
apply(target, thisArg, args) {
  return;
}
});

Object.defineProperty(_window, 'History.replaceState', {
apply(target, thisArg, args) {
  return;
}
});

// TODO: Set WASM globals

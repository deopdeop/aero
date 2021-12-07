/// <reference path="rewrite.ts" />

rewrite = {
  script: body => `
{
  window.document.scripts = _window.document.scripts;
   _window = undefined;
    
  ${body}
}
  `,
  element: element => {
    if (node.tagName === "A" && node.href) {
      node._href = node.href;
      node.href = node.href;
    }
  },
  ...rewrite
}

// TODO: Prevent duplicate rewrites
globalThis.observerCallback = (mutations, observer) =>
  mutations.forEach(mutation => mutation.addedNodes.filter(node => node instanceof Element).forEach(element => {
    Array.concat(element.getElementsByName('A'), element.getElementsByName('AREA')).filter(element => 'href' in element).forEach(link => {
      // TODO: Conceal href
      link._href = link.href;
      link.href = url.rewrite(link.href)
    });
    // TODO: Store original value
    element.getElementsByName('SCRIPT').filter(script => script.text = rewrite.script(element.innerHTML))
    // TODO: Rewrite attributes
  }));

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
    registration.active.postMessage(context.url.origin, [channel.port2]);

    // Write the site's body after this script
    // document.write is blocked when 2G connections are used on chromium and if the document is loaded already it will create a new one so this is used instead
    var script = document.getElementsByTagName('script');
    script[script.length - 1].insertAdjacentHTML("beforebegin", context.body);
  });

// TODO: Instead of overwritting window overwrite specific properties for performance in the self invoking function
globalThis._window = {};

_window.document.cookie = new Proxy(document.cookie, {
  get(target, prop) {
    // TODO: Rewrite
    return Reflect.get(...arguments);
  }
})

// This might not be needed; I am adding this just to be safe, remove if not needed
Object.defineProperty(_window, 'document.scripts', {
  get(target, prop) {
    // Hide the rewriter
    return target[prop - 1];
  }
});

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

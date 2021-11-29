globalThis.observerCallback = (mutations, observer) => {
  console.log(mutations);
  mutations.forEach(mutation => {
    console.log(mutation.target);
    if (mutation.target.href) {
      console.log(mutation.target.href);
      mutation.target.href = rewrite.url(mutation.target.href);
      console.log(mutation.target.href);
      observer.takeRecords();
    }
    if (mutation.target.src) {
      console.log(mutation.target.src);
      mutation.target.src = rewrite.url(mutation.target.src);
      console.log(mutation.target.src);
      observer.takeRecords();
    }
    if (mutation.target.action) {
      console.log(mutation.target.action);
      mutation.target.action = rewrite.url(mutation.target.action);
      console.log(mutation.target.action);
      observer.takeRecords();
    }
    switch (mutation.target.tagName) {
      case 'SCRIPT':
        // ...
        break;
      case 'STYLE':
        // ...
    }

    // Don't observe the recent rewrites
  });
}
new MutationObserver(globalThis.observerCallback)
  .observe(
    document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true
    }
  );

console.log('Writing html')
document.write(ctx.body);

navigator.serviceWorker.register('/sw.js', {
    scope: '/'
  })
  .then(registration => {
    console.log(`The interceptor was registered! The scope is ${registration.scope}`);

    registration.update();

    registration.addEventListener('updatefound', () => {
      console.log(registration.installing)
    });
  });

globalThis._window = Object.assign({}, window);

console.log(_window);

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

// Spyware that was bribed by filtering companies and testing organizations
if ('IdleDetector' in window && ctx.secure) {
  // We should switch to typescript just for these types...
  // https://wicg.github.io/idle-detection/#idl-index
  let UserIdleState;
  let ScreenIdleState;
  let IdleOptions;

  Object.defineProperty(_window.IdleDetection.prototype, 'requestPermission', {
    apply(target, thisArg, args) {
      UserIdleState = true;
      ScreenIdleState = true;
      // TODO: Return promise
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

// TODO: On the service worker create an indexdb entry of the information instead of storing it in browsing history
/*
Object.defineProperty(_window.History, 'pushState', {
apply(target, thisArg, args) {
  return;
}
});
Object.defineProperty(_window.History, 'replaceState', {
apply(target, thisArg, args) {
  return;
}
});
*/
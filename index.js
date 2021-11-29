globalThis.observerCallback = () =>
  mutationsList.forEach(mutation => {
    if (mutation.target.href) {
      mutation.target.href = rewrite.url(mutation.target.href);
      // Don't observe the recent rewrite
      observer.takeRecords();
    }
    // TODO: Rewrite.
  });

let observer = new MutationObserver((mutationsList, observer) => globalThis.observerCallback)
  .observe(
    document.documentElement, {
      attributes: true,
      childList: true,
      subtree: true
    }
  );

navigator.serviceWorker.register('/sw.js')
  .then(registration => console.log(`The interceptor was registered! The scope is ${registration.scope}`));

  // TODO: With Object.defineProperty make the GET function detect if the return value exposes the proxy's host then hide it else send original
globalThis.window = {};

globalThis.window.WebSocket = new Proxy(window.WebSocket, {
  construct(target, args) {
    args[0] = rewrite.url(args[0]);
    return Reflect.construct(...arguments);
  }
});
globalThis.window.RTCPeerConnection.prototype = new Proxy(window.RTCPeerConnection.prototype, {
  construct(target, args) {
    if (args[1].urls.startsWith('turns:')) {
      args[1].username += `|${args[1].urls}`;
      args[1].urls = `turns:${location.host}`;
      return Reflect.apply(...arguments);
    } else if (args[1].urls.startsWith('stuns'))
      console.warn("STUN connections aren't supported!");
  }
})
let rewrite = {
  url: url => {
    if (url.startsWith('data:'))
      return url;
    if (url.startsWith('./'))
      url = url.splice(2);
      
    if (url.startsWith('http')) {
      return `${location.origin}/${url}`;
    } else {
      // TEMPORARY PATCH - TO FIX ENSURE THE CTX IS SENT BEFORE SENDING REQUEST
      if (!ctx) {
        var ctx = { url: { origin: "https://www.google.com" } };
      }
      return `${location.origin}/${ctx.url.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    }
  },
  js: body => `
  (function (window.document.scripts, observerCallback, _window) {
    ${body}
  }(_window.document.scripts, undefined, undefined)
    `
};
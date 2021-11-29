let rewrite = {
  url: url => {
    if (url.startsWith('data:'))
      return url;
      
    if (/\b(https?|ftp|file):\/\/[\-A-Za-z0-9+&@#\/%?=~_|!:,.;]*[\-A-Za-z0-9+&@#\/%=~_|]/.test(url)) {
      console.log('Valid url')
      return `${location.origin}/${url}`;
    } else {
      console.log('Invalid url');
      return `${location.origin}/${ctx.url.origin}/${url}`;
    }
  },
  js: body => `
  (function (window, globalThis.window) {
    ${body}
  }(_window, undefined)
    `
};
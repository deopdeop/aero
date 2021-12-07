let rewrite = {
  url: url => {
    if (url.startsWith('data:'))
      return url;
    if (url.startsWith('./'))
      url = url.splice(2);
      
    if (url.startsWith('http')) {
      return `${location.origin}/${url}`;
    } else {
      return `${location.origin}/${context.url.origin}${url.startsWith('/') ? '' : '/'}${url}`;
    }
  },
};
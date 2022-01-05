function rewriteUrl(url, origin) {
    if (url.startsWith('data:'))
        return url;
    else if (url.startsWith('./'))
        url = url.splice(2);

    const validProtocol = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ws://') || url.startsWith('wss://');

    const rewritten = prefix + (validProtocol ? url : ctx.url.origin + url);

    console.log(rewritten);

    return rewritten;
}

function scope(script) {
    return `
	{
		import '/window.js'
		
		const window = new Proxy({}, {
			get(target, prop) {
				if (prop in _window)
					_window[prop];
			}
		});
		
		${script.replaceAll(/\b(?<!\[[^\]]*(?=\blet\b[^\]]*\])|{[^}]*(?=\blet\b[^}]*}))let\b/g, 'var')}
	}`;
}

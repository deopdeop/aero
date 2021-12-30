const prefix = '/http/';

const rewrite = {
	url(url, origin) {
		if (url.startsWith('data:'))
			return url;
		else if (url.startsWith('./'))
			url = url.splice(2);

		const validProtocol = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ws://') || url.startsWith('wss://');
		let rewritten = prefix + validProtocol ? url : ctx.url.origin + url;
		return rewritten;
	},
	js(script) {
		return `
		{
			${script.replaceAll(/\b(?<!\[[^\]]*(?=\blet\b[^\]]*\])|{[^}]*(?=\blet\b[^}]*}))let\b/, 'var')}
		}`;
	}
};
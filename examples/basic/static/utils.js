'use strict';

export const rewrite = {
	url(url) {
		if (url.startsWith('data:'))
			return url;
		else if (url.startsWith('./'))
			url = url.splice(2);

		console.log(url);
		console.log(ctx);
		console.log('/http/' + url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ws://') || url.startsWith('wss://') ? ctx.origin + url.startsWith('/') ? '' : '/' : url);

		return '/http/' + url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ws://') || url.startsWith('wss://') ? ctx.origin + url.startsWith('/') ? '' : '/' : url;
	},
	js(script) {
		return `
		{
			${script.replaceAll(/\b(?<!\[[^\]]*(?=\blet\b[^\]]*\])|{[^}]*(?=\blet\b[^}]*}))let\b/, 'var')}
		}`;
	}
};
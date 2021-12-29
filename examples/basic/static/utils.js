'use strict';

export const rewrite = {
	url(url, origin) {
		if (url.startsWith('data:'))
			return url;
		else if (url.startsWith('./'))
			url = url.splice(2);

		console.log(url,origin)

		/*
		old code for reference
		'/http/' + url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ws://') || url.startsWith('wss://') ? origin + url.startsWith('/') ? '' : '/' : url
		*/

		const validProtocol = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ws://') || url.startsWith('wss://');
		let rewritten = `/http/${validProtocol ? url : ctx.url.origin + url}`;
		console.log(rewritten)
		return rewritten
	},
	js(script) {
		return `
		{
			${script.replaceAll(/\b(?<!\[[^\]]*(?=\blet\b[^\]]*\])|{[^}]*(?=\blet\b[^}]*}))let\b/, 'var')}
		}`;
	}
};
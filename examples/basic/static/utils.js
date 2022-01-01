const prefix = '/http/';

function url(url) {
		if (url.startsWith('data:'))
			return url;
		else if (url.startsWith('./'))
			url = url.splice(2);

		const validProtocol = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ws://') || url.startsWith('wss://');
		
		console.log(ctx.url.origin);
		
		const rewritten = prefix + (validProtocol ? url : ctx.url.origin + url);

		console.log(rewritten);

		return rewritten;
}
function js(script) {
	return `
	{
		${script.replaceAll(/\b(?<!\[[^\]]*(?=\blet\b[^\]]*\])|{[^}]*(?=\blet\b[^}]*}))let\b/g, 'var')}
	}`;
};
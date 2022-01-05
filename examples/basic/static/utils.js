function rewriteUrl(origin) {
    if (url.startsWith('data:'))
        return url;
    else if (url.startsWith('./'))
        url = url.splice(2);

    const validProtocol = url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ws://') || url.startsWith('wss://');

    const rewritten = prefix + (validProtocol ? url : origin + url);

    console.log(rewritten);

    return rewritten;
}

function scope(script) {
    return `
	{
		${script.replaceAll(/\b(?<!\[[^\]]*(?=\blet\b[^\]]*\])|{[^}]*(?=\blet\b[^}]*}))let\b/g, 'var')}
	}`;
}

export { rewriteUrl, scope };
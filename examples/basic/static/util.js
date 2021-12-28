let rewrite = {
	url: url => {
		if (url.startsWith('data:'))
			return url;
		else if (url.startsWith('./'))
			url = url.splice(2);

		return location.origin + ctx.http.prefix + url.startsWith('http://') || url.startsWith('https://') || url.startsWith('ws://') || url.startsWith('wss://') ? ctx.origin + url.startsWith('/') ? '' : '/' : url;
	},
};
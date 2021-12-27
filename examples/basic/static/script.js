const prefix = '/http/';

function color() {
	console.log('color');
}

function redirectTo(url) {
	window.location.pathname = prefix + url;
}

function go() {
	const url = document.getElementById('search').value;

	if (url !== '') {
		if (url.includes('.') && !url.includes(' '))
			redirectTo(url.substring(0, 4) === 'http' ? url : 'https://' + url);
		else
			redirectTo(`https://search.brave.com/search?q=${url.replace(/ /g, '+')}`);
	}
}

window.addEventListener('load', () => {
	const search = document.getElementById('search');

	search.addEventListener('keyup', async event => {
		if (event.code === 13 && this.value !== '') {
			event.preventDefault();
			this.value = '';
			go(this.value);
		}

		console.log(`${prefix}https://search.brave.com/api/suggest?q=${search.value || ''}`);
		const response = await fetch(`${prefix}https://search.brave.com/api/suggest?q=${search.value || ''}`);
		for (suggestion in response.json()[1]) {
			const option = document.createElement('option');
			option.value = suggestion;
			document.getElementById('suggestions').appendChild(option);
		}
	});
});
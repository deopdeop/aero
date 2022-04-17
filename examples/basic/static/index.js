'use strict';

const prefix = '/http/';

function color() {
	console.log('color');
}

function redirectTo(url) {
	window.location.pathname = prefix + url;
}

const omnibox = document.getElementsByClassName('search')[0];

console.log(omnibox);

function go() {
	const url = omnibox.value;

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
		if (event.key === "Enter") {
			go();
		}
		else if (event.code === 13 && this.value !== '') {
			this.value = '';
			go(this.value);
		} else await fetch(`${prefix}https://search.brave.com/api/suggest?q=${search.value || ''}`)
			.then(response => response.json())
			.then(json => {
				for (suggestion in json[1]) {
					const option = document.createElement('option');
					option.value = suggestion;
					document.getElementById('suggestions').appendChild(option);
				}
			});
	});
});

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js', {
        // The Service-Worker-Allowed must be set to '/'
        scope: prefix,
        // Don't cache http requests
        updateViaCache: 'none',
		// Allow modules
		type: 'module'
    }).then(registration => {
        // Update service worker
        registration.update();
    });
}
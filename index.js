if ('ServiceWorker' in navigator) {
    navigator.serviceWorker.register('interceptor').then((registration) => {
        console.log(
            `The interceptor was registered! The scope is ${registration.scope}`
        );
    });
}

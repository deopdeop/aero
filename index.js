if (navigator.serviceWorker) {
    console.log('We are going to register an interceptor now!');
    navigator.serviceWorker.register('/interceptor.js').then(registration => {
        console.log(
            `The interceptor was registered! The scope is ${registration.scope}`
        );
    });
}
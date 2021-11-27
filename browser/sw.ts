self.addEventListener('fetch', event => {
    event.respondWith((async () => {
        try {
            const response = await event.preloadResponse;
            if (response) return response;

            return await fetch(event.request);
        } catch (e) {
            console.warn(e);
        }
    }
});
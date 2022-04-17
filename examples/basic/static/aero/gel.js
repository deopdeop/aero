onevent = new Proxy(onevent, {
    set(target, prop, value) {
        return Reflect.apply(...arguments)
    }
});

Clients.get = async function(id) {
    const client = await Clients.get(id);
    
    client.url = client.url.match(/(?<=\/http\/).*/g)[0];

    return client;
}

self.addEventListener = new Proxy(self.addEventListener, {
    apply(target, that, args) {
        [type, listener] = args;

        Reflect.apply(...arguments);
    }
});

importScripts = new Proxy(importScripts, {
    apply(target, that, args) {
        Reflect.apply(...arguments)
    }
})
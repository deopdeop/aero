let search = true;

function scopeCheck(prop, beginning) {
    if (search) {
        if (beginning)
            search = true;
            
        if (prop === 'location') {
            search = false;
            return '$location';
        } else if (['this', 'window'].includes(prop))
            return prop;
        else
            search = false;
    } else
        return prop;
}

function scope(script) {
    return script.replace(/(?<![A-Za-z$_])(window|globalThis|this|location)(?=\.|\[)(.*)\[.+?]/g, (match, former, middle, latter) => {
        if (former === 'location')
            return '$' + match;
            
        middle = middle.replace(/\[(.*?)]/g, (match, first, ...matches) => {
            first = `[scopeCheck(${first}, true)]`;
        
            for (match of matches)
                match = `[scopeCheck(${match}, false)]`;
            
            return [first, ...matches];
        });
            
        return former + middle + latter;
    });
}

export {
    scope,
    scopeCheck
};
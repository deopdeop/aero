function rewriteHTML(doc) {
    return doc
        .replace(/<meta.*>/g)
        .replace(/<script.*>(.*)<\/script>/g)
        .replace(/integrity/g, '_$1');
}

export { rewriteHTML };
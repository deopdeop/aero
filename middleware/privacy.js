// Clear history
history.replaceState({}, '');
window.addEventListener('popstate', event => {
    // Don't set the history
    event.preventDefault();
});
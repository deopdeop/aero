const go = () => {
    const redirectTo = url => window.location.href = `/${btoa(url)}`;

    const url = document.getElementById('search').value;
    if (url !== '') {
        if (url.includes('.') && !url.includes(' ', /^ *$/))
            redirectTo(url.substring(0, 4) === 'http' ? url : 'https://' + url);
        else if (url.includes('.') && !url.includes(' ', /^ *$/))
            redirectTo(url.substring(0, 4) === 'http' ? url : 'https://' + url);
        else
            redirectTo(`https://search.brave.com/search?q=${url.replace(/ /g, '+')}`);
    }

    window.addEventListener("load", function() {
        document.querySelector(".go").addEventListener("click", go);
        const search = document.getElementById("search");
        search.addEventListener("keyup", event => {
            event.preventDefault();
            event.keyCode == 13 && search.value !== '' && go();
        });
    });
};
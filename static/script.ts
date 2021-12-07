const go = () => {
    const url = document.getElementById("search").value
    if (url !== "") {
        if (url.includes('.') && !url.includes(' ', /^ *$/)) {
        window.location.href = "/service/" + (url.substring(0, 4) == "http" ? url : "https://" + url);
    } else if (url === "") {
        window.location.href = "/service/" + "https://searx.degenerate.info/";
    } else {
        window.location.href = "/service/" + "https://searx.degenerate.info/search?q=" + url.replace(/ /g, "+");
    }
  }
}

window.addEventListener("load", function() {
    document.querySelector(".go").addEventListener("click", go);
    const search = document.getElementById("search");
    search.addEventListener("keyup", event => {
        event.preventDefault();
        event.keyCode == 13 && search.value !== "" && go();
    });
});
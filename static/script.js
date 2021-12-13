const httpPath = "/http"

const go = () => {
	const redirectTo = url => window.location.href = httpPath + url;

	const url = document.getElementById('search').value;
	if (url !== '') {
		if (url.includes('.') && !url.includes(' '))
			redirectTo(url.substring(0, 4) === 'http' ? url : 'https://' + url);
		else if (url.includes('.') && !url.includes(' '))
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

/*Settings Stuff | Overcomplicated and Doesn't Work

const $ = document.querySelector.bind(document)
const tc = () => {
 localStorage.setItem("tc",localStorage.getItem("tc") ? "" : "true")
 handleToggle()
}
const handleToggle = () => {
  const tc = localStorage.getItem("tc")
    const tcclass = $(".istc").classList
    tcclass.remove(tc ? "disabled" : "enabled")
    tcclass.add(tc ? "enabled" : "disabled")
    $(".istc").innerHTML = tc ? "enabled" : "disabled"
    
}
let tabCloaking = localStorage.getItem("tc") || ""
handleToggle()
window.addEventListener("load", function() {
$(".settings").addEventListener("click", ()=>{
  $("#settings-tab").style.display = "block"
})
$("#tc").addEventListener("click",tc)
$(".go").addEventListener("click",go)
var search = document.getElementById("search")
search.addEventListener("keyup", function(event) {
    event.preventDefault()
    if (event.keyCode == 13)
        if (search.value !== "") {
             go()
        }
    })
});*/
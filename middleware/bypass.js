// Lightspeed Relay image bypass

const width = 100;
const height = 100;
const src = 'https://www.google.com/logos/doodles/2021/seasonal-holidays-2021-6753651837109324.3-ladc.gif'

var svg = document.createElementNS(svg.namespaceURI, 'svg');
svg.setAttribute("width", width);
svg.setAttribute("height", height);

var image = document.createElementNS(svg.namespaceURI, 'image');
image.setAttributeNS(null, 'href', src);

svg.appendChild(image);
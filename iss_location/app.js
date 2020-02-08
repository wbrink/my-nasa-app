// File for retrieving latitude and longitude for iss space station
// then placing on map using leaflet.js

// open-notify api uses no key
// rate limit is every 5 seconds

var Nasakey = "11yQc9WkVjHeeL8IJidQNKHLs6nlOzDY2UvKSo0W"
var queryURL = "http://api.open-notify.org/iss-now.json"

// setting up the map
var myMap = L.map("mapid").setView([51.505, -0.09], 3);

// L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//   maxZoom: 19,
//   attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
// }).addTo(myMap);

L.tileLayer('https://www.osmap.us/#2/24.0/-47.1', {
  maxZoom: 19,
  attribution: '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap contributors</a>'
}).addTo(myMap);


function callAPI() {
  $.ajax({
    url: queryURL,
    method: "GET"
  }).then(function(res) {
    if (!(res.message === "success")) {
      console.log("there seems to be an error");
    }
    console.log(res);
  })
}

var interval = setInterval(function() {
  callAPI();
}, 5000);

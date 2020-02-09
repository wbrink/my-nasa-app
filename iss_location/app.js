// File for retrieving latitude and longitude for iss space station
// then placing on map using leaflet.js

// open-notify api uses no key
// rate limit is every 5 seconds

var Nasakey = "11yQc9WkVjHeeL8IJidQNKHLs6nlOzDY2UvKSo0W"
var queryURL = "http://api.open-notify.org/iss-now.json"
var currentLocation; // array [latitude, longitude]
var prevLocation; // [latitude, longitude]


// setting up the map
var map = L.map("mapid").setView([38.575764, -121.478851], 9); // parameters: [lat, long], zoom

L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 19
}).addTo(map);


// uses api call to make path for ISS
function callAPI() {
  $.ajax({
    url: queryURL,
    method: "GET"
  }).then(function(res) {
    if (!(res.message === "success")) {
      //console.log("there seems to be an error");
      return;
    }
    //console.log(res);
    //console.log([parseFloat(res.iss_position.latitude), parseFloat(res.iss_position.longitude)]);

    // if first run then we want two lines to be equal to create starting point
    if (currentLocation) {
      prevLocation = currentLocation;
      currentLocation = [parseFloat(res.iss_position.latitude), parseFloat(res.iss_position.longitude)];
    } else {
      prevLocation = currentLocation;
      currentLocation = [parseFloat(res.iss_position.latitude), parseFloat(res.iss_position.longitude)];
      prevLocation = [parseFloat(res.iss_position.latitude), parseFloat(res.iss_position.longitude)];

      map.setView(currentLocation, 3) // sets view to where the first 
    }
    
    addLine(prevLocation, currentLocation);
    // var x = currentLocation;
    // addCircle(x);
  })
}


// adds between previous location and current location
function addLine(prevLocation, currentLocation) {
  var latlngs = [prevLocation, currentLocation];
  var polyline = L.polyline(latlngs, {
    color: 'red',
    weight: 5,
    opacity: 0.7,

  }).addTo(map);

}

// // make circles
// function addCircle(x) {
//   L.circle(x, {
//     radius: 15000,
//     opacity: 0.5
//   }).addTo(map);
// }


callAPI(); // get initial call
var interval = setInterval(function() {
  callAPI();
}, 5000);


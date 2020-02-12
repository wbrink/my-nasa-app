// File for retrieving latitude and longitude for iss space station, getting projected orbits
// then placing on map using leaflet.js

// open-notify api uses no key
// rate limit is every 5 seconds

var Nasakey = "11yQc9WkVjHeeL8IJidQNKHLs6nlOzDY2UvKSo0W";
// var queryURL = "http://api.open-notify.org/iss-now.json";
var queryURL = "https://api.wheretheiss.at/v1/satellites/25544?suppress_response_codes=true&units=miles";
var currentLocation; // array [latitude, longitude]
var prevLocation; // [latitude, longitude]
var tleLine1; // data used to make past and future predictions line
var tleLine2;

var locationArray;

// ISS icon
var ISSicon = L.icon({
  iconUrl: "iss.png", 
  iconSize: [75,75]
  //iconAnchor: [40,40]
})

// setting up the map
var map = L.map("mapid");
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
  // maxZoom: 10,
  // minZoom: 2,
  // noWrap: true
}).addTo(map);

var markerGroup = L.layerGroup().addTo(map);
var ISSmarker;
var visibility; // use this to color circle orange if light or dark blue if night


// get TLE string and put current orbit line on map
function addOrbitLines() {
  $.ajax({
    url: "https://api.wheretheiss.at/v1/satellites/25544/tles?suppress_response_codes=true&format=text",
    method: "GET"
  }).then(function(res) {
    if (res.error){
      return;
    }
    
    // window.TestData is function from bundle.js which used browserify to be able to use npm packages in browser
    locationArray = window.TestData; // function that creates projections based on data returns array of [lat, long]
    locationArray({
      tle: res,
      stepMS: 10000, // makes it slightly less acurate but loads faster, as step increases the data points go down
      isLngLatFormat: false
    }).then(function(threeOrbitsArr) {
      var currentOrbit = threeOrbitsArr[1];
      for (var i = 0; i < currentOrbit.length-10; i++) {
        if (i === 0) {
          addLine(currentOrbit[0], currentOrbit[0], "blue", 3);
        } else {
          addLine(currentOrbit[i-1], currentOrbit[i], "blue", 3);
        }
      }

      // chart future orbit 
      var futureOrbit = threeOrbitsArr[2];
      // length - 10 because there is overlap that will cause line to start from beginning again
      for (var i = 0; i < futureOrbit.length-10; i++) {
        if (i === 0) {
          addLine([futureOrbit[0][0], futureOrbit[0][1] + 360], [futureOrbit[0][0], futureOrbit[0][1] + 360], "red", 3);
        } else {
          addLine([futureOrbit[i-1][0], futureOrbit[i-1][1] + 360], [futureOrbit[i][0], futureOrbit[i][1] + 360], "red", 3);
        }
      }


      var pastOrbit = threeOrbitsArr[0];
      for (var i = 0; i < pastOrbit.length-10; i++) {
        if (i === 0) {
          addLine([pastOrbit[0][0], pastOrbit[0][1] - 360], [pastOrbit[0][0], pastOrbit[0][1] - 360], "purple", 3);
        } else {
          addLine([pastOrbit[i-1][0], pastOrbit[i-1][1] - 360], [pastOrbit[i][0], pastOrbit[i][1] - 360], "purple", 3);
        }
      }

    })
    

  })
}

// uses api call to make path for ISS
function getCurrentISSPosition() {
  $.ajax({
    url: queryURL,
    method: "GET"
  }).then(function(res) {
    // if (!(res.message === "success")) {
    //   //console.log("there seems to be an error");
    //   return;
    // }
    if (res.error) {
      return;
    }
    // var latitude = res.iss_position.latitude; // for other api
    // var longitude = res.iss_position.longitude; // for other api
    var latitude = res.latitude;
    var longitude = res.longitude;
    visibility = res.visibility;
    
    $("#velocity").text(res.velocity);
    $("#altitude").text(res.altitude);
    $("#visibility").text(res.visibility)
    // if first run then we want two lines to be equal to create starting point
    if (currentLocation) {
      
      prevLocation = currentLocation;
      currentLocation = [parseFloat(latitude), parseFloat(longitude)];
    } else {
      prevLocation = currentLocation;
      currentLocation = [parseFloat(latitude), parseFloat(longitude)];
      prevLocation = [parseFloat(latitude), parseFloat(longitude)];

      map.setView(currentLocation, 2) // sets view to where the first 
      ISSmarker = L.marker(currentLocation, {icon: ISSicon}).addTo(markerGroup);
      
    }
    
    //addLine(prevLocation, currentLocation, 'yellow', 6);
    addISS(currentLocation);
    
  })
}




// adds between previous location and current location
function addLine(prevLocation, currentLocation, color, weight) {
  var latlngs = [prevLocation, currentLocation];
  var polyline = L.polyline(latlngs, {
    color: color,
    weight: weight,
    opacity: 0.4,

  }).addTo(map);

}

// adds the ISS animation
function addISS(currentLocation) {
  markerGroup.clearLayers(); // add to marker groups in order to be able to remove
  ISSmarker = L.marker(currentLocation, {icon: ISSicon}).addTo(markerGroup);

  if (visibility == "eclipsed") { // in earth's shadow
    var circle = L.circle(currentLocation, {
      radius: 500000,
      fillColor: "#49699e",
      color: "#49699e",
      fillOpacity: 0.5
    })
  } else if (visibility == "daylight") {
    var circle = L.circle(currentLocation, {
      radius: 500000,
      fillColor: "#dbbe39",
      color: "#dbbe39",
      fillOpacity: 0.5
    })
  }

  

  // change circle size based on map zoom levels
  var zoomLevel = map.getZoom();
  if (zoomLevel === 2 || zoomLevel === 3) {
    circle.setRadius(1500000);
  } else if (zoomLevel === 1) {
    circle.setRadius(3000000);
  } 

  

    
  circle.addTo(markerGroup)
  //map.setView(currentLocation, 2);
}


// main
addOrbitLines();
getCurrentISSPosition(); // get initial call
var interval = setInterval(function() {
  getCurrentISSPosition();
}, 5000);


/////// event listener on click
// map.on('click', function(e){
//   var coord = e.latlng;
//   var lat = coord.lat;
//   var lng = coord.lng;
//   console.log("You clicked the map at latitude: " + lat + " and longitude: " + lng);
// });

/// event listener on zoom
// map.on("zoom", function(e) {
//   console.log(map.getZoom());
// })
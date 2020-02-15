// File for retrieving latitude and longitude for iss space station, getting projected orbits
// then placing on map using leaflet.js

// open-notify api uses no key
// rate limit is every 5 seconds

// var queryURL = "http://api.open-notify.org/iss-now.json";
var queryURL = "https://api.wheretheiss.at/v1/satellites/25544?suppress_response_codes=true&units=miles";
var currentLocation; // array [latitude, longitude]
var prevLocation; // [latitude, longitude]
var tleLine1; // data used to make past and future predictions line
var tleLine2;

var locationArray;
var circle; 

// ISS icon
var ISSicon = L.icon({
  iconUrl: "assets/images/iss_white.png", 
  iconSize: [70,70],
  minZoom: 1
})

// setting up the map
var map = L.map("mapid");
// L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
// 	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
// 	subdomains: 'abcd',
//   // maxZoom: 10,
//   minZoom: 1
//   // noWrap: true
// }).addTo(map);

var NASAGIBS_ViirsEarthAtNight2012 = L.tileLayer('https://map1.vis.earthdata.nasa.gov/wmts-webmerc/VIIRS_CityLights_2012/default/{time}/{tilematrixset}{maxZoom}/{z}/{y}/{x}.{format}', {
	attribution: 'Imagery provided by services from the Global Imagery Browse Services (GIBS), operated by the NASA/GSFC/Earth Science Data and Information System (<a href="https://earthdata.nasa.gov">ESDIS</a>) with funding provided by NASA/HQ.',
	bounds: [[-85.0511287776, -179.999999975], [85.0511287776, 179.999999975]],
	minZoom: 1,
	maxZoom: 8,
	format: 'jpg',
	time: '',
  tilematrixset: 'GoogleMapsCompatible_Level'
});

NASAGIBS_ViirsEarthAtNight2012.addTo(map);

var markerGroup = L.layerGroup().addTo(map);
var circleGroup = L.layerGroup().addTo(map);
var lineGroup = L.layerGroup().addTo(map);
var ISSmarker;
var visibility; // use this to color circle orange if light or dark blue if night
var meanMotion; // Revolutions around the Earth per day (mean motion).


// from leafletjs tutorials
// creating control area
var info = L.control();
info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};
// method that we will use to update the control based on feature properties passed
info.update = function (velocity, altitude, visibility) {
    this._div.innerHTML = '<h4 >ISS Info</h4>' +  
        '<b>Velocity:</b> ' + velocity + ' mph<br /><b>Altitude: </b>' + altitude + ' mi<br /><b>Visibility:</b>' + visibility +'<br><b>Mean Motion: </b>' + parseFloat(meanMotion).toFixed(2);
};
info.addTo(map);


// adding legend to tell about orbits
var legend = L.control({position: "bottomright"});
legend.onAdd = function() {
  var div = L.DomUtil.create('div', 'info'); // create a div with a class info and legend
  div.innerHTML = "<h4>Orbits</h4><div><span class='past orbit'>dd</span> Past</div><div><span class='current orbit'>dd</span> Current</div><div><span class='future orbit'>dd</span> Future</div>";
  return div;
}
legend.addTo(map);



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
    locationArray = window.getGroundTracks; // function that creates projections based on data returns array of [lat, long]
    meanMotion = window.getMeanMotion(res);
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
    if (res.error) {
      return;
    }
    // var latitude = res.iss_position.latitude; // for other api
    // var longitude = res.iss_position.longitude; // for other api
    var latitude = res.latitude;
    var longitude = res.longitude;
    visibility = res.visibility;
    var velocity = parseFloat(res.velocity).toFixed(2);
    var altitude = parseFloat(res.altitude).toFixed(2);

    // update control on map
    info.update(velocity, altitude, visibility);

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

  }).addTo(lineGroup);

}

// adds the ISS animation
function addISS(currentLocation) {
  markerGroup.clearLayers(); // add to marker groups in order to be able to remove
  circleGroup.clearLayers();
  ISSmarker = L.marker(currentLocation, {icon: ISSicon}).addTo(markerGroup).bindPopup("<p>Latitude: " + currentLocation[0].toFixed(3) + "</p><p> Longitude: " + currentLocation[1].toFixed(3) + "</p>");
  map.setView(currentLocation);

  if (visibility == "eclipsed") { // in earth's shadow
    circle = L.circle(currentLocation, {
      radius: 500000,
      fillColor: "#49699e",
      color: "#49699e",
      fillOpacity: 0.5
    })
  } else if (visibility == "daylight") {
    circle = L.circle(currentLocation, {
      radius: 500000,
      fillColor: "#dbbe39",
      color: "#dbbe39",
      fillOpacity: 0.5
    })
  }

  var zoom = map.getZoom();
  if (zoom == 1) {
    circle.setRadius(2500000);
  } else if (zoom == 2) {
    circle.setRadius(1500000);
  } else if (zoom == 3) {
    circle.setRadius(1000000);
  }

  circle.addTo(circleGroup);
  map.setView(currentLocation);
}


// main
addOrbitLines();
getCurrentISSPosition(); // get initial call
var interval = setInterval(function() {
  // if satellite is in its next orbit
  if (currentLocation[1] < 0 && prevLocation[1] > 0) {
    // reload the orbits
    lineGroup.clearLayers();
    addOrbitLines();


  }
  getCurrentISSPosition();
}, 5000);


// event listener on zoom
map.on("zoom", function(e) {
  var layers = circleGroup.getLayers();

  // if no circles in group then do nothing (would happen when page is getting started)
  if (layers.length == 0) {
    return;
  } else {
    var zoom = map.getZoom();
    console.log(map.getZoom());
    //circleGroup.clearLayers();
    if (zoom === 1) {
      circle.setRadius(2500000);
    } else if (zoom === 2) {
      circle.setRadius(1500000);
    } else if (zoom === 3) {
      circle.setRadius(1000000);
    } else if (zoom == 4) {
      circle.setRadius(500000-10000);
    }
  }
})
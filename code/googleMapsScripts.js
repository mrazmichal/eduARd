/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


// Google api key
// Used for Google dynamic map and Google static map
var API_KEY = "";

var map1;
var marker;

// We append the script to body so we can have the API_KEY as a variable
var mapLink = "https://maps.googleapis.com/maps/api/js?key=" + API_KEY + "&libraries=places&callback=myMap";
var mapScript = document.createElement("script");
mapScript.setAttribute("src", mapLink);
document.getElementsByTagName("body")[0].appendChild(mapScript);


/**
 * Initialize Google dynamic map, maps marker position, autocomplete search
 */
function myMap() {

	//Londyn
	//var location = { lat: 51.508742, lng: -0.120850 };

	//Barrandovske skaly
	//var location = { lat: 50.03112687503623, lng: 14.400673153577372 };

	//Namesti Miru
	var location = { lat: 50.07518, lng: 14.43643 };

	var mapOptions1 = {
		center: new google.maps.LatLng(location.lat, location.lng),
		zoom: 9,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		controlSize: 32
		// disableDefaultUI: true,
		// panControl: false,
		// zoomControl: true,
		// mapTypeControl: true,
		// scaleControl: false,
		// streetViewControl: false,
		// overviewMapControl: false,
		// rotateControl: false
	};

	map1 = new google.maps.Map(document.getElementById("googleMap1"), mapOptions1);
	marker = new google.maps.Marker({ map: map1, position: map1.center });
	
	displayLatLngInOverlay(marker.position.lat(), marker.position.lng());

	google.maps.event.addListener(map1, 'click', function (event) {
		marker.setPosition(event.latLng);
		// displayLatLngInOverlay(event.latLng.lat(), event.latLng.lng());
		displayLatLngInOverlay(marker.position.lat(), marker.position.lng());
	});

	initAutocomplete();
}

/**
 * Display latitude and longitude in the GPS creation window
 */
function displayLatLngInOverlay(lat, lng){
	document.getElementById("textField1").textContent = "lat: " +lat + "\nlng: " + lng;
}

/**
 * Change the map so the maps marker is in it's center
 */
function centerMapOnMarker() {
	map1.setCenter(marker.position);
}

/**
 * Set map marker position and center the map on it
 */
function mapFakeClick(lat, lng){
	var latlng = new google.maps.LatLng(lat, lng);
	marker.setPosition(latlng);
	displayLatLngInOverlay(lat, lng);
	centerMapOnMarker();
}

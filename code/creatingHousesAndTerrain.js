/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 * 
 * This file contains functions for generation of x3dom models of buildings and terrain.
 * The generation is based on data from Google maps, Google elevation API, OpenStreetMaps.
 **/


// Creates x3d document
var x3dDoc = document.implementation.createDocument(null, "X3D");


// Settings for static map
// 640x640 is maximum free resolution of the static map
var staticMapPixelsWidth = 640;
var staticMapPixelsHeight = 640;
var staticMapZoom = 18; //17 default


// GPS coords
var leftDown, rightTop;
var centerObject;

// Sizes of the map rectangle
var lngDistance, latDistance;


// GPS MyObject
var anchor



var osmDoc, worldContent, nodes, ways, nodeId2indexMap, pointsLatLng;

// Container for LatLng points from the grid
var gridPointsLatLng = [];

/**
 * Starts a chain of functions, which download static map, elevation data and buildings data. 
 * (Terrain and buildings) x3dom elements are then created from the data.
 * @param {MyObject} gpsObject 
 */
async function createAndShowHousesAndTerrain(anch) {

	anchor = anch

	if (anchor.gpsCoordinates == null){
		// console.log("GPS coords null");
		let center = getCenterObjectFromMapsMarker()
		anchor.gpsCoordinates = center
	}

	// Display loading wheel
	LoadingStateManager.incrementLoadingCount();

	centerObject = anchor.gpsCoordinates

	// Compute rectangle bounds
	createBounds();


	// Get height and width of OSM window in meters
	convertOSMwindowSizesToMeters();

	// Create data for future x3d grid creation
	createGridData();

	// Create LatLng points distributed on the grid
	createGridPointsLatLng();



	await Promise.all([
		// Download data from OSM
		// and process them
		downloadOSM().then(textOSM => processOSM(textOSM)),
		// Download elevation data for every point on the grid and for the center
		downloadElevationData()
	])

	// Create terrain model
	convertDataToX3D();

}

function getCenterObjectFromMapsMarker(){
	// Get google maps marker's position, which is a maps API LatLng object, contains .lat and .lng
	var centerMarkerPosition = marker.position; // returns maps API LatLng object, contains .lat and .lng

	var centerLat = centerMarkerPosition.lat();
	var centerLng = centerMarkerPosition.lng();

	return { lat: centerLat, lng: centerLng };
}


/**
 * Gets Gooogle maps marker position (latitude, longitude), sets Google static maps parameters 
 * (width, height in pixels, zoom level), computes distance between edges of the resultant map 
 * (in lat, lng), sets corners of the map (lat, lng)
 */
function createBounds() {

	var centerLat = centerObject["lat"];
	var centerLng = centerObject["lng"];


	// Get LatLng from pixel coordinates of static map ====================================
	// Following code taken from https://stackoverflow.com/questions/47106276/converting-pixels-to-latlng-coordinates-from-google-static-image

	w = staticMapPixelsWidth;
	h = staticMapPixelsHeight;
	zoom = staticMapZoom;
	lat = centerObject.lat;
	lng = centerObject.lng;

	/**
	 * Get LatLng of pixel in static map
	 * @param {*} x X coord of pixel in static map
	 * @param {*} y Y coord of pixel in static map
	 */
	function getPointLatLngFromPixels(x, y) {
		// Formulae...
		var parallelMultiplier = Math.cos(lat * Math.PI / 180);
		var degreesPerPixelX = 360 / Math.pow(2, zoom + 8);
		var degreesPerPixelY = 360 / Math.pow(2, zoom + 8) * parallelMultiplier;
		var pointLat = lat - degreesPerPixelY * (y - h / 2)
		var pointLng = 1 * lng + degreesPerPixelX * (x - w / 2)

		return { lat: pointLat, lng: pointLng };
	}
	// End of taken code



	// Compute latitude and longitude change between two border points of the rectangle
	latDistance = computeLatDistance(getPointLatLngFromPixels(w / 2, 0).lat, getPointLatLngFromPixels(w / 2, h).lat);
	lngDistance = computeLngDistance(getPointLatLngFromPixels(w, h / 2).lng, getPointLatLngFromPixels(0, h / 2).lng);

	// Lat and Lng of bounds
	var leftBound = centerLng - (lngDistance / 2);
	var rightBound = centerLng + (lngDistance / 2);
	var topBound = centerLat + (latDistance / 2);
	var bottomBound = centerLat - (latDistance / 2);

	// Points in corners
	leftDown = { lat: bottomBound, lng: leftBound };
	rightTop = { lat: topBound, lng: rightBound };
}




/**
 * Downloads data from OpenStreetMap 
 */
async function downloadOSM() {

	// These stopped working because of CORS...
	// var link = "http://openstreetmap.org/api/0.6/map?bbox=" + leftDown.lng + "," + leftDown.lat + "," + rightTop.lng + "," + rightTop.lat;
	// var link = "http://api.openstreetmap.org/api/0.6/map?bbox=" + leftDown.lng + "," + leftDown.lat + "," + rightTop.lng + "," + rightTop.lat;

	// Slow overpass api:
	// https://overpass-api.de/api/map?bbox=14.42855,50.07779,14.43327,50.07955
	var link = "https://overpass-api.de/api/map?bbox=" + leftDown.lng + "," + leftDown.lat + "," + rightTop.lng + "," + rightTop.lat;
	

	console.log("sending OSM data request");
	var response = await fetch(link, {
		method: 'GET'
	})

	if (!response.ok){
		message("Couldn't download OSM data.");
		return;
	}

	console.log("received OSM data");

	var txt = await response.text();

	return txt;

}



// Process downloaded OSM data
async function processOSM(txt) {

	// Parse XML to DOM
	var parser = new DOMParser();
	osmDoc = parser.parseFromString(txt, "text/xml");

	// In x3d create element Group
	worldContent = x3dDoc.createElement("Group");
	// Set it's id attribute
	worldContent.setAttribute("id", "worldContent"); // maybe not used

	// Get nodes from OSM
	// Node = single point in space defined by its latitude, longitude and node id
	// https://wiki.openstreetmap.org/wiki/Node
	nodes = osmDoc.getElementsByTagName('node');
	// Get ways from OSM
	// Way = ordered list of nodes
	// https://wiki.openstreetmap.org/wiki/Way
	ways = osmDoc.getElementsByTagName('way');

	// Map from OSM node ids to pointsXYZ indexes (our generated indexes starting from 0)
	nodeId2indexMap = createNodeId2indexMap(nodes);

	// Convert OSM nodes to LatLng points
	pointsLatLng = getPointsLatLng(nodes);



	// Continue after elevation data are downloaded...
	

}



/**
 * Download elevation data for every point on the grid and for the center
 */
function downloadElevationData() {

	// We will get elevation data for: 
	// centerObject, gridPointsLatLng

	// Array of LatLng objects
	var elevationInputPoints = [centerObject].concat(gridPointsLatLng);

	// Input for Google Elevation API
	var elevationApiInput = {'locations': elevationInputPoints};

	return new Promise((resolve, reject) => {

		getGoogleElevationData(elevationApiInput);

		/**
		 * Get elevation data from Google
		 * @param {*} locations list of points
		 */
		function getGoogleElevationData(locations) {
			// Some code used from 
			// https://developers.google.com/maps/documentation/javascript/examples/elevation-simple

			// Create an ElevationService
			var elevator = new google.maps.ElevationService;

			// Initiate the location request
			console.log("sending elevation data request");
			elevator.getElevationForLocations(locations, receiveFunction)


			function receiveFunction(results, status) {
				if (status === 'OK') {
					//results[0].elevation + ' meters.');
					console.log("received elevation data");
					processElevationData(results);
				} else {
					console.log('Elevation service failed due to: ' + status);
					reject();
				}
			}

		}

		/**
		 * Process the received elevation data
		 * @param {*} results received data
		 */
		function processElevationData(results) {
			// Add "ele" property to the input objects of elevation data download request (or arrays)
			for (var i = 0; i < elevationInputPoints.length; i++) {
				if (i < 1) {
					centerObject.ele = results[i].elevation;
				} else {
					gridPointsLatLng[i - 1].ele = results[i].elevation;
				}
			}

			resolve();
		}

	})
	


	


}





// Local coordinated of lefttop corner of our map window
var leftTopXYZ;

/**
 * Create terrain model in x3d
 */
function convertDataToX3D() {


	// x3d terrain grid
	var gridShape = createGrid();
	// Append grid
	worldContent.appendChild(gridShape);

	// Create local points from received LatLng points
	var pointsXYZ = convertPointsLatLng2pointsXYZ();

	// Get buildings ways
	var buildingWays = getBuildingsFromWays(ways);

	// Initialize local point leftTopXYZ from LatLng point leftTop
	var leftTop = { lat: rightTop.lat, lng: leftDown.lng };
	leftTopXYZ = convertPointLatLng2pointXYZ(leftTop);


	//BUILDINGS - points, height, ele, create, add
	for (var i = 0; i < buildingWays.length; i++) {
		// Get XYZ points corresponding to nodes of the way
		var points = selectPointsOfWay(buildingWays[i], pointsXYZ, nodeId2indexMap);
		
		// Get approximate building height
		var height = findOutBuildingHeight(buildingWays[i]);

		// Find elevation  of the building - elevation of it's lowest point
		var elevation = findOutBuildingElevation(points);
		

		// Placeholder - random elevation
		//var elevation = Math.round(Math.random()*40);


		// Create building model
		var buildingTransform = createBuilding(points, height, x3dDoc, elevation);
		// Append building to target
		worldContent.appendChild(buildingTransform);
	}


	//removeIfExists("worldContent");


	// Translate world vertically
	// Instead of translating all locators, we translate only world in the opposite direction
	var terrainCenterElev = findTerrainCenterElevation();
	var worldElevationInverseTranslation = x3dDoc.createElement("Transform");
	worldElevationInverseTranslation.setAttribute("translation", "0 " - terrainCenterElev + " 0");
	worldElevationInverseTranslation.appendChild(worldContent);

	// Append x3d content to Anchor
	anchor.group.appendChild(worldElevationInverseTranslation);


	// Switch to globalView
	// document.getElementById("globalView").setAttribute('set_bind', 'true');

	// Reset x3d view
	// document.getElementById("x3d").runtime.resetView();


	console.log("buildings and terrain appended to x3d scene");

	// Make loading cog invisible
	// loadingCog.style.display = "none";
	// turnOffOverlay("loadingOverlay");
	LoadingStateManager.decrementLoadingCount();

}


/**
 * Get Y coordinate (elevation) of the center of terrain grid
 */
function findTerrainCenterElevation(){
	
	// Get center point in local coordinates
	var centerPointXYZ = convertPointLatLng2pointXYZ({lat:centerObject.lat, lng:centerObject.lng});

	// Compute elevation of center point by interpolation on terrain grid
	// (the actual center elevation from elevation request is not used here)
	var modelElev = findPointLocalElevation(centerPointXYZ);
	
	return modelElev;
	
}




/**
 * Return elevation of lowest point of the building
 * @param {*} points 
 */
function findOutBuildingElevation(points) {

	// Initialize the lowest point of the building
	var minElevation = 1000;


	for (var k = 0; k < points.length; k++) {

		// Find point elevation on the terrain grid
		var pointElevation = findPointLocalElevation(points[k]);

		if (pointElevation < minElevation) {
			minElevation = pointElevation;
		}

	}


	return minElevation;

}



/**
 * Find elevation of point on the terrain grid
 * @param {*} point XYZ local point
 */
function findPointLocalElevation(point){
	// Finds elevation of a given point (e.g. vertex of a building groundplan polygon) 
	// by interpolating near points on the terrain grid

	// Warning: leftTopXYZ must be initialized first
	

	// Finds grid cell, to which the point belongs. The cell is specified by indexes of it's points on the right and on bottom.

	var rightXborder;

	for (var j = 0; j < gridData.xDimension + 1; j++) {
		// If point is on the left from right cell border
		if (point.x <= 1 * leftTopXYZ.x + j * gridData.cellSizeX) {
			rightXborder = j;

			break;
		}
		else if (j >= gridData.xDimension) {
			rightXborder = j;

			break;
		}
	}

	var downZborder;

	for (var i = 0; i < gridData.zDimension + 1; i++) {
		// If point is above bottom cell border
		if (point.z <= 1 * leftTopXYZ.z + i * gridData.cellSizeZ) {
			downZborder = i;

			break;
		}
		else if (i >= gridData.zDimension) {
			downZborder = i;

			break;
		}
	}



	var xOffsets = [-1, 0, -1, 0];
	var zOffsets = [-1, -1, 0, 0];

	if (rightXborder == 0) {
		xOffsets = [0, 0, 0, 0];
	} else if (rightXborder >= gridData.xDimension) {
		xOffsets = [-1, -1, -1, -1];
	}

	if (downZborder == 0) {
		zOffsets = [0, 0, 0, 0];
	} else if (downZborder >= gridData.zDimension) {
		zOffsets = [-1, -1, -1, -1];
	}


	// Coords of corner points of the cell in grid coordinates; Left Top, Right Top, Left Down, Right Down
	var cornerPoints = [];

	// Cell corner XYZ elevation
	var cornerEle = [];

	//XYZ coordinates
	var cornerXYZ = [];

	for (var i = 0; i < 4; i++) {
		cornerPoints[i] = { x: 1 * rightXborder + xOffsets[i], z: 1 * downZborder + zOffsets[i] };

		cornerEle[i] = gridPointsElev[cornerPoints[i].x + (gridData.zDimension - cornerPoints[i].z - 1) * gridData.xDimension];

		cornerXYZ[i] = { x: 1 * leftTopXYZ.x + cornerPoints[i].x * gridData.cellSizeX, z: 1 * leftTopXYZ.z + cornerPoints[i].z * gridData.cellSizeZ };
	}


	// Distance of point from left border of our map rectangle
	var dX = point.x - cornerXYZ[0].x;
	var dZ = point.z - cornerXYZ[0].z;




	if (rightXborder == 0 || rightXborder >= gridData.xDimension) {
		dX = 0;
	}

	if (downZborder == 0 || downZborder >= gridData.zDimension) {
		dZ = 0;
	}


	// Fraction of map rectangle size, where the points position is
	var pX = dX / gridData.cellSizeX;
	var pZ = dZ / gridData.cellSizeZ;

	// if (pX > 1.01 || pZ > 1.01){
	// 	console.log("error, cell fraction higher than 1");
	// }

	//interpolate elevation horizontally
	var topInterpolated = cornerEle[0] + (cornerEle[1] - cornerEle[0]) * pX;
	var downInterpolated = cornerEle[2] + (cornerEle[3] - cornerEle[2]) * pX;

	// //interpolate elevation horizontally
	// var topInterpolated = LT + (RT - LT) * pX;
	// var downInterpolated = LD + (RD - LD) * pX;

	//vertically
	var interpolated = topInterpolated + (downInterpolated - topInterpolated) * pZ;

	return interpolated;



}




// Remember selected map rectangle's sizes in meters
var heightM, widthM;

/**
 * Get height and width of OSM window in meters:
 */
function convertOSMwindowSizesToMeters() {

	// Get maximal latitude - probably from north pole to south
	var fullLatM = latLng2xyFromOrigin({ lat: 180, lng: 0 }).y;
	// Get height of our selected map rectangle
	heightM = (latDistance / 180) * fullLatM;

	// Get maximal longitude - circle around Earth
	var fullLngM = latLng2xyFromOrigin({ lat: centerObject.lat, lng: 360 }).x;
	// Get height of our selected map rectangle
	widthM = (lngDistance / 360) * fullLngM;
}


// Container for grid data
var gridData;

/**
 * Create data for future x3d grid creation
 */
function createGridData() { // is in local (meters) coordinates, elevation computation needs latLng coords
	// Our ground plane in x3dom is the XZ plane?
	var sizeX = widthM;
	var sizeZ = heightM;;

	// Number of cells on the grid in given dimension
	var numCellsX = 22; // Number of cells in a dimension is one less than number of points in that dimension
	var numCellsZ = 22;

	// Size of one cell
	var cellSizeX = 1.0 * sizeX / (numCellsX - 1);
	var cellSizeZ = 1.0 * sizeZ / (numCellsZ - 1);

	// Total number of points
	var numPointsTotal = numCellsX * numCellsZ;

	// Grid will be created from this
	gridData = { xDimension: numCellsX, zDimension: numCellsZ, sizeX: sizeX, sizeZ: sizeZ, cellSizeX: cellSizeX, cellSizeZ: cellSizeZ, numCells: numPointsTotal };
}




/**
 * Create grid LatLng points starting from leftDown corner of our selected map rectangle
 */
function createGridPointsLatLng() {
	var baseLatLng = leftDown;
	// Compute step sizes
	var stepX = lngDistance / gridData.xDimension;
	var stepZ = latDistance / gridData.zDimension;

	// Go through all points on the grid
	for (var i = 0; i < gridData.zDimension; i++) {
		for (var j = 0; j < gridData.xDimension; j++) {
			// Create LatLng for every grid point
			gridPointsLatLng[i * gridData.xDimension + j] = { lat: baseLatLng.lat * 1 + stepZ * i, lng: baseLatLng.lng * 1 + stepX * j };
			//gridPointsLatLng[i * gridData.xDimension + j] = { lat: baseLatLng.lat * 1 + stepZ * (gridData.zDimension -1 -i), lng: baseLatLng.lng * 1 + stepX * j }; // now is Z going north, when converting to local coords, it will be reversed?
		}
	}
}



var gridPointsElev = [];

/**
 * Create the x3d element ElevationGrid from prepared data
 */
function createGrid() {
	// gridData
	var shape = x3dDoc.createElement("Shape");
	var appearance = x3dDoc.createElement("Appearance");
	var texture = x3dDoc.createElement("ImageTexture");

	var link = "https://maps.googleapis.com/maps/api/staticmap?center=" + centerObject.lat + "," + centerObject.lng + "&zoom=" + staticMapZoom + "&size=" + staticMapPixelsWidth + "x" + staticMapPixelsHeight + "&maptype=satellite&key=" + API_KEY;

	texture.setAttribute("url", link);

	console.log("setting elevationGrid texture");

	var elevationGrid = x3dDoc.createElement("ElevationGrid");
	elevationGrid.setAttribute("creaseAngle", '0.0');//'1.57');
	elevationGrid.setAttribute("solid", 'false');
	elevationGrid.setAttribute("xDimension", gridData.xDimension);
	elevationGrid.setAttribute("zDimension", gridData.zDimension);
	elevationGrid.setAttribute("xSpacing", gridData.cellSizeX);
	elevationGrid.setAttribute("zSpacing", gridData.cellSizeZ);

	for (var i = 0; i < gridPointsLatLng.length; i++) {
		gridPointsElev[i] = gridPointsLatLng[i].ele - centerObject.ele;
	}

	var heightsString = "";
	for (var i = 0; i < gridPointsElev.length; i++) {
		if (i > 0) {
			heightsString += " ";
		}
		heightsString += gridPointsElev[i];
	}

	elevationGrid.setAttribute("height", heightsString);

	shape.appendChild(appearance);
	appearance.appendChild(texture);
	shape.appendChild(elevationGrid);


	var transform = x3dDoc.createElement("Transform");
	transform.setAttribute("scale", "1 1 -1");
	var shift = convertPointLatLng2pointXYZ(leftDown);
	//transform.setAttribute("translation", 0 + " 0 " + 0);
	transform.setAttribute("translation", shift.x + " 0 " + shift.z);

	transform.appendChild(shape);
	
	return transform;

}


/**
 * Convert points from LatLng format to XYZ coords (coords that we can use in our x3dom scene)
 */
function convertPointsLatLng2pointsXYZ() {

	// Container for converted points
	// Array of points converted to local coordinates ([0, 0, 0] is in middle of the area)
	var pointsXYZ = [];

	// For every point LatLng
	for (var i = 0; i < pointsLatLng.length; i++) {
		var pointLatLng = pointsLatLng[i];

		// Convert it to point XYZ
		var pointXYZ = convertPointLatLng2pointXYZ(pointLatLng);
		// Note:
		// In the XY coord system: X is going east, Y is going north
		// In X3D coord system: X is going east, Z is going SOUTH (and -Z is going north, Y is going up)

		
		pointsXYZ.push(pointXYZ);
	}
	return pointsXYZ;
}


/**
 * Converts LatLng point to point XYZ
 * @param {*} pointLatLng 
 */
function convertPointLatLng2pointXYZ(pointLatLng) {
	var coordsXY = latLng2localXY(lngDistance, latDistance, widthM, heightM, centerObject, pointLatLng);

	// Conversion to x3d coordinates
	// We do not yet know elevation => y is zero
	var pointXYZ = { x: coordsXY.x, y: 0, z: -coordsXY.y }; // maybe if y wasn't negated here, we wouldn't have to scale the X3D ElevationGrid by -1
	return pointXYZ;
}




/**
 * Removes an html element if it exists
 * @param {*} id Id of the html element
 */
function removeIfExists(id) {
	var node = document.getElementById(id);
	if (node != null) {
		node.parentNode.removeChild(node);
	}
}


// //draw all ways:
// for (var i = 0; i < ways.length; i++){
// 	var points = selectPointsOfWay(ways[i], pointsXYZ, nodeId2indexMap);
// 	createPolygon(points, scene, x3dDoc);
// }


/**
 * Create building model (with elevation transform)
 * @param {*} points local XYZ points
 * @param {*} height building height in meters
 * @param {*} x3dDoc x3d document for x3d nodes creation
 * @param {*} elevation building elevation
 */
function createBuilding(points, height, x3dDoc, elevation) {


	//GROUP for the whole building
	var group = x3dDoc.createElement("Group");


	//ROOF -----------------------------
	//create roof
	var polygon = createPolygon(points, x3dDoc); //shape

	//translate roof
	var transformRoof = x3dDoc.createElement("Transform");
	transformRoof.setAttribute("translation", "0 " + height + " 0");

	transformRoof.appendChild(polygon);

	group.appendChild(transformRoof);		


	//WALLS ----------------------------------------

	//<Extrusion beginCap='true' ccw='true' convex='true' creaseAngle='0' crossSection='[(1,1), (1, -1), (-1, -1), (-1, 1), (1, 1)]' endCap='true' height='0' lit='true' metadata='X3DMetadataObject' orientation='[(0,0,0,1)]' scale='[(1,1)]' solid='true' spine='[(0,0,0)]' useGeoCache='true' ></Extrusion>

	//create walls base
	var cross = createWallsBase(points);

	var extr = x3dDoc.createElement("Extrusion");
	extr.setAttribute("beginCap", "false");
	extr.setAttribute('ccw', 'false');
	extr.setAttribute('convex', 'false');
	extr.setAttribute('endCap', 'false');
	extr.setAttribute('solid', 'false');
	var str = '0 0 0 0 ' + height + ' 0';
	extr.setAttribute('spine', str);
	//extr.setAttribute('height', height); // Instant player doesn't support this
	extr.setAttribute('crossSection', cross);
	extr.setAttribute("creaseAngle", "0.00");

	var shape = x3dDoc.createElement("Shape");
	var app = x3dDoc.createElement("Appearance");
	shape.appendChild(app);
	var mat = x3dDoc.createElement("Material");
	app.appendChild(mat);
	mat.setAttribute("diffuseColor", "0.84 0.7 0.2");

	mat.setAttribute("specularColor", '0.001 0.001 0.001');
	mat.setAttribute("ambientIntensity", '0.333');
	mat.setAttribute("shininess", '0.133');


	shape.appendChild(extr);
	

	group.appendChild(shape);
	//-----------------------------------------


	var transformBuilding = x3dDoc.createElement("Transform");
	transformBuilding.setAttribute("translation", "0 " + elevation + " 0");



	transformBuilding.appendChild(group);


	return transformBuilding;

}


/**
 * Create string of building's base points
 * @param {*} points list of building's base polygon points
 */
function createWallsBase(points) {
	var string = "";
	for (var i = 0; i < points.length; i++) {
		string += points[i].x + " " + points[i].z + " ";
	}
	return string;
}

/**
 *  Get approximate building height
 * @param {*} buildingWay 
 */
function findOutBuildingHeight(buildingWay) {

	// Approximate height of one floor (in meters)
	var levelHeight = 3;

	var children = buildingWay.childNodes;
	for (var j = 0; j < children.length; j++) {
		if (children[j].nodeName == 'tag') {
			// If height is given:
			if (children[j].getAttributeNode("k").nodeValue == "height") {
				// Height in meters
				return children[j].getAttributeNode("v").nodeValue;
			}
			// Else if number of levels is given:
			else if (children[j].getAttributeNode("k").nodeValue == "building:levels") {
				// Number of levels times levelHeight
				return children[j].getAttributeNode("v").nodeValue * levelHeight;
			}
		}
	}
	// If nothing was given:
	var defaultBuildingLevels = 2;
	return levelHeight * defaultBuildingLevels;
}



/**
 * Create x3dom polygon
 * @param {*} points 
 * @param {*} x3dDoc 
 */
function createPolygon(points, x3dDoc) {

	// (Could be made simpler by just having an x3d html string of the whole thing?)

	var shape = x3dDoc.createElement("Shape");
	//scene.appendChild(shape);
	shape.setAttribute("render", "true");

	var app = x3dDoc.createElement("Appearance");
	shape.appendChild(app);

	var mat = x3dDoc.createElement("Material");
	app.appendChild(mat);

	mat.setAttribute("diffuseColor", '1 0 0'); //'0.82 0 0'
	mat.setAttribute("specularColor", '0.001 0.001 0.001');
	mat.setAttribute("ambientIntensity", '0.333');
	mat.setAttribute("shininess", '0.133');
	// diffuseColor="1.000 0.000 0.000" specularColor="0.001 0.001 0.001" emissiveColor="0.000 0.000 0.000" ambientIntensity="0.333" shininess="0.133" transparency="0.0" />

	//geometry:
	var ifs = x3dDoc.createElement("IndexedFaceSet");
	shape.appendChild(ifs);

	//convex="false" colorPerVertex="false" ccw="false"
	ifs.setAttribute("convex", "false");
	ifs.setAttribute("ccw", "false");
	ifs.setAttribute("solid", "false");
	ifs.setAttribute("creaseAngle", "4.0");

	// var cpvAtt = x3dDoc.createAttribute("colorPerVertex");
	// coordIndexAtt.nodeValue = "false";
	// ifs.setAttributeNode(cpvAtt);


	var string = "";
	for (var i = 0; i < points.length; i++) {
		string += i + " ";
	}


	ifs.setAttribute("coordIndex", string);

	var coordinate = x3dDoc.createElement("Coordinate");
	ifs.appendChild(coordinate);

	var string2 = "";
	for (var i = 0; i < points.length; i++) {
		var point = points[i];
		string2 += point.x + " " + point.y + " " + point.z + " ";
	}

	var pointAtt = x3dDoc.createAttribute("point");
	pointAtt.nodeValue = string2;
	coordinate.setAttributeNode(pointAtt);

	return shape;
}


//not used
//formerly used for viewing x3d file in BS contact, it also needs the nodes to have proper Camel case, because of that nodes must be created by x3dDocument.createElement to keep the upper case letters
function x3dDocSerialize(x3dDoc) {
	//SERIALIZATION
	var s = new XMLSerializer();
	var str = s.serializeToString(x3dDoc);
	//console.log(str);
	return str;
}







/**
 * Converts OSM nodes to LatLng points
 * @param {*} nodes OSM nodes
 */
function getPointsLatLng(nodes) {

	var pointsLatLng = [];
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];
		var coordsLatLng = { lat: node.getAttributeNode('lat').nodeValue, lng: node.getAttributeNode('lon').nodeValue };

		pointsLatLng.push(coordsLatLng);
	}
	return pointsLatLng;
}

/**
 * Maps OSM node ids to newly generated indexes
 * @param {*} nodes 
 */
function createNodeId2indexMap(nodes) {
	// Mapping from node id to new indexes
	var nodeId2indexMap = {};
	// Generate indexes from 0
	for (var i = 0; i < nodes.length; i++) {
		// Get node
		var node = nodes[i];
		// Get value of "id" attribute
		var nodeId = node.getAttributeNode("id").nodeValue;

		// Map index to id
		nodeId2indexMap[nodeId] = i;
	}
	return nodeId2indexMap;
}

/**
 * Get buildings from ways
 * @param {*} ways OSM ways
 */
function getBuildingsFromWays(ways) {
	// Filter words
	var words = ["building", "building:part"];
	// Buildings array
	var buildings = [];

	for (let i = 0; i < ways.length; i++) {
		var children = ways[i].childNodes;
		for (var j = 0; j < children.length; j++) {
			if (children[j].nodeName == 'tag' && isWordOneOfThese(children[j].getAttributeNode("k").nodeValue, words)) {
				buildings.push(ways[i]);
				break;
			}
		}
	}

	return buildings;
}


/**
 * Return true if words contains word
 * @param {*} word 
 * @param {*} words 
 */
function isWordOneOfThese(word, words) {
	for (var i = 0; i < words.length; i++) {
		if (word == words[i]) {
			return true;
		}
	}
	return false;
}

/**
 * Return local XYZ points corresponding to LatLng points of way
 * @param {*} way 
 * @param {*} pointsXYZ local points
 * @param {*} nodeId2indexMap mapping
 */
function selectPointsOfWay(way, pointsXYZ, nodeId2indexMap) {
	var pointsOfWay = [];

	var children = way.childNodes;
	// Go through children of way		
	for (var j = 0; j < children.length; j++) {
		// If child is a reference to a node
		if (children[j].nodeName == 'nd') {
			// Find the referenced node and return the corresponding local point (local coordinates point)
			var point = selectPointByID(pointsXYZ, nodeId2indexMap, children[j].getAttributeNode('ref').nodeValue);
			pointsOfWay.push(point);
		}
	}
	return pointsOfWay;
}


/**
 * Select local coordinates point corresponding to the given OSM id
 * @param {*} pointsXYZ list of points in local coordinates
 * @param {*} nodeId2indexMap mapping OSM ids to our point indexes
 * @param {*} ID OSM node id
 */
function selectPointByID(pointsXYZ, nodeId2indexMap, ID) {
	return pointsXYZ[nodeId2indexMap[ID]];
}

// //other version:
// function selectPointByID(nodes, ID){
// 	for(i = 0; i < nodes.length; i++){
// 		if (nodes[i].getAttributeNode('id').nodeValue == ID){
// 			return nodes(i);
// 		}
// 	}
// }


/**
 * Computes location of a given LatLng point in relation to the center of the selected map rectangle
 * @param {*} widthLng Longitude size of our selected map rectangle
 * @param {*} heightLat Latitude size of our selected map rectangle
 * @param {*} widthM Width in meters size of our selected map rectangle
 * @param {*} heightM Height in meters size of our selected map rectangle 
 * @param {*} centerObject Object which contains lat, lng and elevation attributes
 * @param {*} coords Point Latlng, is changing
 */
function latLng2localXY(widthLng, heightLat, widthM, heightM, centerObject, coords) {
	// The new coordinates are centered in the middle of the area
	// 2D plane, x goes to the right, y to the top (simulating latLng coordinates directions)

	// Difference of two latitude values in degrees
	var latDistance = computeLatDistance(coords.lat, centerObject.lat);
	// Convert to distance in meters
	var latDistanceM = (latDistance / heightLat) * heightM;

	// Difference of two longitude values in degrees
	var lngDistance = computeLngDistance(coords.lng, centerObject.lng);
	// Convert to distance in meters
	var lngDistanceM = (lngDistance / widthLng) * widthM;

	return { x: lngDistanceM, y: latDistanceM };
}




/**
 * Compute latitude distance between two values (in degrees)
 * @param {*} lat2 
 * @param {*} lat1 
 */
function computeLatDistance(lat2, lat1) {
	var distance = lat2 - lat1;
	return distance;
}

/**
 * Compute longitude distance between two values (in degrees)
 * @param {*} lng2 
 * @param {*} lng1 
 */
function computeLngDistance(lng2, lng1) {
	var distance = lng2 - lng1;
	if (Math.abs(distance) > 180) {
		distance = 360 - lng1 + 1 * lng2;
	}
	return distance;
}


/**
 * 
 * @param {*} coords Point LatLng
 */
function latLng2xyFromOrigin(coords) {

	// Mean earth radius (in meters)
	var R = 6371000;

	// Convert degrees to radians
	var latRad = degreesToRadians(coords.lat);
	var lngRad = degreesToRadians(coords.lng);

	// Get y in meters
	var y = latRad * R;
	// Get x in meters
	var x = lngRad * R * Math.cos(latRad); // computed for smaller circle at given latitude 
	// Explanation:
	// On equator Math.cos(latRad) is 1, in Europe Math.cos(latRad) is approximately Math.cos(50 degrees) == cos(0.872665 rad) == 0.64278732318
	// So the longitude circle radius for Europe is about 0.64 * R

	return { x: x, y: y };
}
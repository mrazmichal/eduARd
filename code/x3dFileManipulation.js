/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 * 
 * This file contains functions that can load X3D file, filter out some nodes, change texture urls
 **/



// Whether file content will be filtered
var FILTER = true;

// List of x3d nodes to remove from the model
var FILTER_NODES = ["background", "Background", "script", "Script", "viewpoint", "Viewpoint", "navigationInfo", "navigationinfo", "NavigationInfo", "PlaneSensor", "planeSensor", "planesensor", "SphereSensor", "sphereSensor", "spheresensor", "TouchSensor", "touchSensor", "touchsensor", "DirectionalLight", "Directionallight", "directionalLight", "directionallight", "PointLight", "pointLight", "Pointlight", "pointlight", "SpotLight", "spotLight", "Spotlight", "spotlight"];


// FILE MANIPULATION ***************************

/**
 * Modify the file before uploading it to server
 * @param {*} file X3D file
 */
async function modifyX3dFile_beforeUpload(file){
	// Remove unwanted nodes
	var blob = await filterX3dBlob(file);

	// We are now modifying the file before uploading to server
	var forLocalViewing = false;
	// Extract only texture filenames and set them as texture urls
	blob = await modifyTextureUrls_inBlob(blob, forLocalViewing);
	// Reconstruct file
	var file2 = await makeFILEfromBlob(blob, file.name);
	
	// Print
	var t = await makeTextFromBlob(file2)
	console.log(t);

	return file2;
}

function makeFILEfromBlob(blob, filename){
	var file = new File([blob], filename);
	return file;
}

// BLOB MANIPULATION ***************************

async function makeDocumentFromBlob(blob){
	var text = await makeTextFromBlob(blob);
	
	return makeDocumentFromText(text);
}

function makeBlobFromDocument(doc){
	var text = makeTextFromDocument(doc);
	var blob = makeBlobFromText(text);
	return blob;
}

function makeTextFromBlob(blob){
	if (blob == undefined){
		console.log("blob undefined");
		return;
	} else {
		// console.log("loading blob");
	}

	return readFile(blob);

	function readFile(blob){
		return new Promise((resolve, reject) => {
			var fr = new FileReader();  
			fr.onload = () => {
				resolve(fr.result)
			};
			
			fr.readAsText(blob);
			
			
		});
	}

}

function makeBlobFromText(text){
	var blob = new Blob([text], {type : 'text/xml'});
	
	return blob;
}

function makeTextFromDocument(doc) {
	var s = new XMLSerializer();
	var str = s.serializeToString(doc);
	return str;
}

function makeDocumentFromText(text){
	var parser = new DOMParser();
	var xmlDoc = parser.parseFromString(text,"text/xml");
	return xmlDoc;
}

//TEXTURES ***********************************


function getTextures_fromBlob(blob){
	
	return makeDocumentFromBlob(blob)
	.then(doc => {
		let textures = getRelevantTextures_fromDoc(doc);
		return textures;
	});
}


/**
 * Return imageTexture nodes which have urlString longer than 0
 */
function getRelevantTextures_fromDoc(xmlDoc){

	var strings = ["ImageTexture", "imageTexture", "imagetexture"];
	var list = [];
	for (var i = 0; i < strings.length; i++){		
		var nodes = xmlDoc.getElementsByTagName(strings[i]);
		for (var j = 0; j < nodes.length; j++){
			var node = nodes[j];
			var urlString = node.getAttribute("url");

			// var val = node.getFieldValue("url");
			// console.log(val)

			if (urlString != undefined && urlString.length > 0){
				list.push(node);
			}
		}
	}
	return list;
}


/**
 * Replace texture urls with texture filenames (when modifying before upload)
 * or replace texture urls with fetchUrl (when viewing dowloaded x3d file)
 * @param {*} doc X3D file document
 * @param {*} forLocalViewing whether we are modifying before upload or before viewing
 * @param {*} modelMyObject 
 */
async function modifyTextureUrls_inDocument(doc, forLocalViewing, modelMyObject){

	if (forLocalViewing){
		modelMyObject.listOfTextureAssetIds = [];
	}
	

	// get list of assets
	var assets = await BackendAPI.getAllScenarioAssets(Scenario.currentScenarioId)

	var textures = getRelevantTextures_fromDoc(doc);

	// For every texture
	for(var j = 0; j < textures.length; j++){
		var texture = textures[j];
		// the filename contained in texture url path
		var filename = getFilenameFromTexture(texture); 
		// Go through every asset
		for (var i = 0; i < assets.length; i++){
			var asset = assets[i];
			// If filename from url matches asset name
			if(filename == asset.name){
				
				var url;
				if (forLocalViewing){
					// Replace the url with a fetchUrl
					// (only local change for viewing in editor! This edited file should not be uploaded)
					url = apiUrl + asset.fetchUrl;
				} else {
					// For uploading the file
					url = '"' + filename + '"';
				}
				console.log(url);

				// These don't work:
				// texture.setFieldValue("url", '"' + url + '"');
				// texture.setFieldValue("url", url);

				texture.setAttribute("url", url);


				if (forLocalViewing){
					modelMyObject.listOfTextureAssetIds.push(asset.id);
				}
				
				
				break;
			}
		}
	}

}


async function modifyTextureUrls_inBlob(blob, forLocalViewing, modelMyObject){
	var doc = await makeDocumentFromBlob(blob);
	// modify texture
	await modifyTextureUrls_inDocument(doc, forLocalViewing, modelMyObject);	
	return makeBlobFromDocument(doc);
}

/**
 * Extract filename from X3D texture url
 */
function getFilenameFromTexture(texture){
	var url = texture.getAttribute("url");
	url = extractShortestTextureUrl(url);
	url = removeQuotesFromUrl(url);
	url = getOnlyFilenameFromPath(url);
	return url;	
}

function getOnlyFilenameFromPath(url){
	// Gets the end of string, doesn't contain a slash // regex testing https://www.regextester.com/3269
	let regex = /([^/])+$/g 
	let res = url.match(regex);
	return res;
}

/**
 * extracts shortest substring, eg extracts "word" from '"word" "longerWord" "evenLongerWord"'
 * @param {*} url 
 */
function extractShortestTextureUrl(url){
	var shortest = url;

	let regex = /"([^"])*"/g // regex testing https://www.regextester.com/3269
	let list = url.match(regex);
	for (var i = 0; i < list.length; i++){
		var candidate = list[i];
		if(candidate.length < shortest.length && candidate.length > 0){
			shortest = candidate;
		}
	}

	return shortest;
}

function removeQuotesFromUrl(url){
	return url.replace(/['"]+/g, ''); // deletes quotes // taken from https://stackoverflow.com/questions/19156148/i-want-to-remove-double-quotes-from-a-string
}


//FILTER ***********************************

/**
 * Filter unwanted nodes from blob
 */
function filterX3dBlob(blob){
	if (!FILTER){
		return blob;
	}

	let filteredBlob = makeTextFromBlob(blob)
		.then(text => {
			let doc = makeDocumentFromText(text);
			let doc2 = filterUnwantedTagsFromDocument(doc, FILTER_NODES);
			let text2 = makeTextFromDocument(doc2);
			let blob2 = makeBlobFromText(text2);
			return blob2;
		});

	return filteredBlob;
}

/**
 * Remove unwanted nodes from document
 * @param {*} xmlDoc document
 * @param {*} strings tags we are looking for
 */
function filterUnwantedTagsFromDocument(xmlDoc, strings){
	for (var i = 0; i < strings.length; i++){
		var nodes = xmlDoc.getElementsByTagName(strings[i]); // nodes is a HTMLCollection - is automatically updated when the underlying document is changed.
		while (nodes[0]) {
			nodes[0].parentNode.removeChild(nodes[0]);
			console.log("removed some node from model");
		}
	}

	return xmlDoc;
}





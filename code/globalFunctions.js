/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


// Generally useful functions


/**
 * Remove item from an array without leaving empty spaces
 * @param {*} array 
 * @param {*} item 
 */
function removeItemFromArray(array, item){
    var idx = array.indexOf(item);
    if (idx >= 0){
        array.splice(idx, 1);
    }    
}

/**
 * remove all children of a node
 * @param {*} node 
 */
function removeElementChildren(node){
    if (node){
        while (node.hasChildNodes()) {
            node.removeChild(node.lastChild);
        }
    }
    
}

/**
 * Convert html string to an element
 * Code taken from https://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro
 * @param {string} html Html string
 */
function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim(); // Never return a text node of whitespace as the result
    template.innerHTML = html;
    return template.content.firstChild;
}

/**
 * Rounds a number to x decimal places
 * @param {*} num Given number 
 * @param {*} x Number of places
 */
function roundToXDecimalPlaces(num, x){
    var multiplier = Math.pow(10, x);
    return (Math.round(num * multiplier)) / multiplier;
}





/**
 * Checks if MyObject is of typeString type
 * @param {*} object MyObject
 * @param {*} typeString myObjectType
 */
function checkIfObjectType(object, typeString){
    if (object && object.myObjectType && object.myObjectType === typeString){
        return true;
    } else {
        console.log("The provided object's type is not " + typeString);
        return false;
    }
}

/**
 * Sets the given item of an array to undefined 
 * (Used as a pre-step for removing item from an array)
 * @param {*} array 
 * @param {*} item 
 */
function changeArrayItemToUndefined(array, item){
    var index = array.indexOf(item);
    if (index >= 0){
        array[index] = undefined;
    }
    return array;    
}             

/**
 * Removes undefined items from given array
 * (actually removes all items that are "false")
 * @param {*} array 
 */
function filterUndefinedArrayItems(array){
    array = array.filter(function(e){
        if(e) return true
    });
    return array;
}

/**
 * Check if object (JSON) is empty
 * probably not used
 * @param {*} obj 
 */
function isEmpty(obj) {
    return Object.keys(obj).length === 0;
}


/**
 * Convert radians to degrees
 */
function radiansToDegrees(radians){
    return radians / Math.PI * 180;
}

/**
 * Convert degrees to radians
 */
function degreesToRadians(degrees){
    return degrees / 180 * Math.PI;
}

/**
 * Round number
 * Probably not used
 */
function round(num){
    return roundToXDecimalPlaces(num, 2);
}

// Provide information mostly about errors
// 

/**
 * Display a message to the user
 * In future the message could be displayed in some status bar, now is displayed in a pop up window overlay
 * @param {*} string Message to the user
 * @param {*} error 
 */
function message(string, error){
    // See it in console
    console.log("::-MESSAGE-::")
    // Display the window
    turnOnOverlay('messageOverlay');
    
    // Put message and error description together
    let str;
    if (error){
        str = string + ", " + error;
    } else {
        str = string;
    }
    
    // Update window text content
    messageContent.textContent = str;
    
    // Display also in console
    if (!error){
        console.error(string)
    } else {
        console.error(string + ",", error);    
    }
    
}

/**
 * Display a help message with the given string as content
 */
function helpMessage(string){
    turnOnOverlay('helpOverlay');
    helpContent.textContent = string;
}

/**
 * Main window help
 */
function globalHelp(){
    helpMessage(
        `In this application you create AR content by building an object tree. 
        Scenario object is the root of this tree.
        Each object has a specific object type.
        New objects are created by selecting an existing object and clicking for example "Create child Annotation" option.
        The new object is appended to the selected object after creation.
        Which objects can be created from the selected object depends on the selected object's type.
        
        Scenarios are stored on server, the changes you make are not automatically saved. You can save the scenario by selecting the Scenario object and clicking the save button.
        
        3D view controls:
        Rotate camera: hold left mouse button and drag
        Zoom: scroll or hold right mouse button and drag
        Pan: hold middle mouse button and drag
        Change center of rotation: double click on some place
        Focus camera on an object: double click the object in the outliner
        
        To insert an X3D model into an empty Scenario you need to follow these steps:
        1) Have an open Scenario
        2) Create a Scene
        3) Create a scene anchor - either Marker or GPS
        4) Create a Locator
        5) Create a Model - in this step you also upload an X3D file`
    )
}

/**
 * Refresh multiple things at once
 * Probably not used
 */
function refreshAll(){
    Outliner.refresh();
    Outliner.refreshProperties();
    Gizmo.refresh();
}

/**
 * Delete all scenarios having their id in the given range from first to second (excluding second)
 * @param {*} first 
 * @param {*} second 
 */
function deleteScenariosFromTo(first, second){
    for (var i = first; i < second; i++){
        BackendAPI.deleteScenario(i);
    }
}


/**
 * Refreshes Trigger and Action targets
 */
function refreshAllTargets(){
    let list = allObjectsList;
    // For every myObject
    for (let key in list){
        let obj = list[key];
        // If the object is Trigger or Action
        if (MyObject.checkIfObjectIsOfTypes(obj, ["Trigger", "Action"])){
            // Refresh target
            Trigger.refreshTarget(obj);
        }
        
    }
    return undefined;
}


/**
 * Print Scenario JSON
 */
function printJson(){
    console.log(Serialization.stringifyScenarioJson());
}

/**
 * Cycles through x3dom views
 */
function switchViewPoint() {
	document.getElementById("x3d").runtime.nextView();
	document.getElementById("x3d").runtime.resetView();
}

/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


var assetUser;
var myObjectReferencer;

/**
 * Check if some myObject is using the asset with given id
 * If there is such myObject, remember the object and return true
 * @param {*} id asset id
 */
function checkIfAssetIsBeingUsed(id){
    for(var i = 0; i < allObjectsList.length; i++){
        var object = allObjectsList[i];
        if (object._checkIfAssetUsed(id)){
            assetUser = object; // remember it
            return true;            
        }
    }
    return false;
}

/**
 * Tell user the asset is being used
 */
function message_assetIsUsed(){
    message("Can't delete, the asset is used by " + assetUser._getDisplayName());
}

/**
 * Check if given myObject is referenced by some other myObject (probably as target object in Action or Trigger)
 * @param {myObject} obj 
 */
function checkIfReferencesToMyObject(obj){
    for(var i = 0; i < allObjectsList.length; i++){
        var object = allObjectsList[i];
        if (object.myObjectType == "Action" || object.myObjectType == "Trigger"){
            if (object.target == obj){
                myObjectReferencer = object; // remember it
                return true;            
            }
        }
    }
    return false;
}

/**
 * Tell user the object is being referenced
 */
function message_myObjectIsReferenced(){
    message("Can't delete, the object is referenced by " + myObjectReferencer._getDisplayName());
}
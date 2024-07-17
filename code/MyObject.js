
/**
 * Original author	Michal Mráz
 * Created:   	  	29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


// List of all myObjects
allObjectsList = [];

// List of all MyObject types
myObject_objectTypesList = [
"Scenario",
"Scene",
"Marker",
"GPS",
"Locator",
"Model",
"ModelPart",
"MyObject_Animation",
"Event",
"Trigger",
"Action",
"Annotation",
"Button",
"Picture",
"Video"
]

/**
 * Ancestor object to many other MyObjects 
 * Contains functions common to all myObjects
 */
class MyObject {

    /**
     * Initialize basic MyObject
     * @param {MyObject} parent 
     * @param {string} objectType 
     * @param {string array} allowedParentTypes 
     */
    constructor(parent, objectType, allowedParentTypes, name){
        
        // If parent exists
        if (parent){
            // Check if parent's type is valid
            if (MyObject.assertObjectIsOfTypes(parent, allowedParentTypes)){
                // Is valid
            } else {       
                // This could theoretically happen if somehow this myObject was created from some incompatible myObject
                console.error("Object's parent is of incorrect type");    
            }
        }
                
        // Remember last id for every type of myObject
        var counters = scenario_namingCounters;

        if (name){
            // Externally given name - is not used
            this.name = name;
        } else {
            // Create object name - objectType and next id for this type
            this.name = objectType + counters.get(objectType);
            // Update counters
            counters.set(objectType, counters.get(objectType) +1);
        }
        
        // Set objectType
        this.myObjectType = objectType; 

        // If the parent MyObject exists (doesn't when creating Scenario)
        if (parent){
            // Set parent MyObject
            this.parent = parent;
            // Add to parent's children
            parent.children.push(this);

            // Reorder parent's children
            MyObject.reorderChildrenOfObject(parent);
        } else {
            this.parent = null;
            console.log("Created object "+ this.myObjectType +" with no parent")
        }

        // Initialize object's children
        this.children = [];

        // Add object to list of all objects
        allObjectsList.push(this);

        // Re-display the myObject tree
        Outliner.refresh();
    }
    

    /**
     * Set MyObject's nickname
     * @param {MyObject} object 
     * @param {string} string 
     */
    static rename(object, string){
        object.nickname = string;
    }


    /**
     * Delete object
     * @param {MyObject} object 
     */
    static delete(object){

        if (checkIfReferencesToMyObject(object)){
            message_myObjectIsReferenced();
            return;
        }
        
        // Recursively deletes MyObject tree, sets object's parent's reference to object as undefined
        delete_inner(object);

        // Removes reference to object from object's parent
        if (object.parent){
            object.parent.children = filterUndefinedArrayItems(object.parent.children);
        }
        
        // Refresh some things
        Outliner.refresh();// Needed everytime
        // Tabs.refresh();// Needed if object is Scene
        Gizmo.refresh();// Needed if object is Model or Locator

        // Click on object's parent
        if (object.parent){
            Outliner.fakeClick(object.parent);
        }
        
        
        /**
         * Delete MyObject and it's tree
         * @param {MyObject} object 
         */
        function delete_inner(object){

            // Leaf nodes will be deleted first
            for (var i = 0; i < object.children.length; i++){
                // Recursively call this function again
                delete_inner(object.children[i]);
            }

            if (object.myObjectType == "Scenario"){
                // Scenario "can't be deleted" - we delete it's children and set scenario reference to undefined
                scenario = undefined
            } 
            else if (object.myObjectType == "Scene"){
                if (scene_active == object){
                    
                    scene_active = undefined;
                }
            } else {
                // If object is of one of these types
                let list = ["Marker", "GPS", "Locator", "Model"];                
                if (list.includes(object.myObjectType)){
                    // Remove it's x3dom representation
                    object.group.parentElement.removeChild(object.group);
                }
            }

            
            // Set the object's parent's reference to object to undefined (Important! If deleted directly, the tree traversal goes wrong)
            if (object.parent){
                object.parent.children = changeArrayItemToUndefined(object.parent.children, object);
            }

            // Filter out undefined children of this object
            object.children = filterUndefinedArrayItems(object.children);


            // If object was the activeMyObject
            if (outliner_active.activeMyObject == object){
                // Set activeMyObject to undefined
                outliner_active.activeMyObject = undefined;
            }


            // Remove object from the list of all MyObjects
            removeItemFromArray(allObjectsList, object);


        } //END of delete_inner

    } //END of delete


    /**
     * Check if object's type is included in typeStrings
     * @param {MyObject} object 
     * @param {string array} typeStrings list of MyObject types
     */
    static checkIfObjectIsOfTypes(object, typeStrings){
        if (typeStrings.includes(object.myObjectType)){
            return true;
        }
        return false;
    }

    /**
     * Check if object's type is included in typeStrings
     * AND show a message
     * @param {MyObject} object 
     * @param {string array} typeStrings list of MyObject types
     */
    static assertObjectIsOfTypes(object, typeStrings){
        
        if (MyObject.checkIfObjectIsOfTypes(object, typeStrings)){
            return true;
        } else {
            console.log("The object's type is not in {" + typeStrings + "}");
            console.log("The object's type is", object.myObjectType)
            console.log(object)
            return false;
        }
    }


    /**
     * Set MyObject's nickname according to inputted String
     * @param {MyObject} object 
     * @param {string} newName 
     */
    static setNameFromTextInput(object, newName){
        if (newName && newName.length > 0){
            object.nickname = newName;
            Outliner.refresh();
        }
    }

    /**
     * Reorder children of object according to the index of their myObjectType
     * @param {MyObject} object 
     */
    static reorderChildrenOfObject(object){
        // Sort with a new sorting function
        object.children.sort(function(objectA, objectB) {

            // List of types
            var list = myObject_objectTypesList;
            var aType = objectA.myObjectType;
            var bType = objectB.myObjectType;
            
            // Return first index minus second index
            return list.indexOf(aType) - list.indexOf(bType);
        });

    }

    /**
     * Used for recursive serialization of the MyObject tree
     * Abstract
     */
    _serializeIntoJson(item) {
        throw new Error('You have to implement the MyObject method _serializeIntoJson !');
     }

    /**
     * Used for recursive DEserialization of the MyObject tree
     * Abstract
     */
    _deserializeFromJson(item) {
        throw new Error(`You have to implement the MyObject ${this.myObjectType} method _deserializeFromJson !`);
     }

    /**
     * Can be overriden by relevant myObjects
     */
    _checkIfAssetUsed(id) {
        return false;
     }

     /**
      * Return name or nickname if it's longer than 0
      */
    _getDisplayName(){
        var displayName = "";
        if (this.nickname && this.nickname.length > 0){
            displayName = this.nickname;
        } else {
            displayName = this.name;
        }
        return displayName;
    }

    async _isReadyForTargetDetection(){
        for (var i = 0; i < this.children.length; i++){
            var child = this.children[i];
            // We could be waiting for the result (async inside)
            var childReady = child._isReadyForTargetDetection();
            if (!childReady){
                return false;
            }
        }
        return true;        
    }

}


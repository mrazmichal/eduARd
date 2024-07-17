/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


/**
 * Functions related to scenario serialization, interacts with myObject _serialize and _deserialize functions
 */
class Serialization {

    /**
     * Create JSON object tree based on given MyObject object and it's MyObject tree
     * @param {MyObject} object 
     */
    static serializeIntoJson(object){

        // The object for JSON file will be called "item"
        var item = {
            objectType : object.myObjectType,
            nickname : object.nickname? object.nickname : "",
            name : object.name,
            _comment : object.comment? object.comment : "" // If comments are used in future, we are ready
        };

        object._serializeIntoJson(item);

        return item;
    }

    /**
     * Helps with MyObject serialization into JSON - recurrently serializes currObject's MyObject tree
     * @param {json object} item the currently builded JSON item
     * @param {string} property the item's property to be assigned to
     * @param {string} type MyObject type, according to which we will filter currObject's children
     * @param {boolean} arr a boolean specifying, whether we want to assign an array of objects or a single object.
     * @param {MyObject} currObject the myObject we are currently building the item from
     */
    static serializationHelper(item, property, type, arr, currObject){
        //MyObject.item_property_type_arr(item, "annotation", "Annotation", false);

        //"annotation" and "annotations" are example names, actually they are children filtered by type

        // If there should be multiple JSON children
        if (arr){
            // Declare JSON array
            item[property] = [];
            var annotations = this.getChildrenWithType(type, currObject);
            for (let annotation of annotations){
                // Serialize child object and add the result to array in JSON
                item[property].push(this.serializeIntoJson(annotation));
            }
        // If there should be only one JSON child
        } else {
            // Declare JSON object
            item[property] = {};
            var annotations = this.getChildrenWithType(type, currObject);
            // Add only first child object and break
            for (let annotation of annotations){
                // Get only first item (there shouldnt be more)
                // Serialize child object and add the result to JSON as object
                item[property] = this.serializeIntoJson(annotation);
                break;
            }
        }

    }

    /**
     * Get children of object which are of the specified type
     * @param {string} typeString MyObject type
     * @param {MyObject} object
     */
    static getChildrenWithType(typeString, object){
        var ret = [];
        var arr = object.children;
        for(var i = 0; i < arr.length; i++){
            // If the MyObject is of typeString type
            if (arr[i].myObjectType == typeString){
                // Add it
                ret.push(arr[i]);
            }
        }
        return ret;
    }



    /**
     * Basic general MyObject deserialization, _deserializeFromJson continues deserialization specific to each MyObject type
     * @param {*} item JSON object
     */
    static deserializeFromJson(item, parentMyObject = null){
        let type = item["objectType"]     
        let name = item["name"]
        // Initialize MyObject of given type
        // (because of this we need "var Locator = class Locator..." in every MyObject)
        let object = new window[type](parentMyObject, name)
        // Give it basic MyObject attributes
        // object.myObjectType = item["objectType"]
        object.nickname = item["nickname"]
        // object.name = item["name"]
        object.comment = item["_comment"]

        // Note: Child MyObjects are automatically added to parent's children list during MyObject creation!
        
        object._deserializeFromJson(item)
    }

    /**
     * Stringifies the serialized JSON so it's easily readable by human
     */
    static stringifyScenarioJson(){
        return JSON.stringify(Serialization.serializeIntoJson(scenario), undefined, 4)
    }




}


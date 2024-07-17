/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/



var trigger_allowedObjectTypes;


var Trigger = class Trigger extends MyObject {
    constructor(parent, name){

        super(parent, "Trigger", ["Event"], name);   
        
    }

    /**
     * Assign properties to Trigger
     */
    static setTrigger(trigger, triggerType, parameters, target){
        trigger.triggerType = triggerType;
        trigger.parameters = parameters;
        if (target == undefined){
            console.error("target undefined");
        }
        trigger.target = target;
        
        trigger.tmpTargetName = target.name;
    }

    static createTriggerFromForm(){
        
        var triggerType = document.getElementById("selectTriggerType").value;

        // List of parameters
        var parameters = [];
        // The parameters div - contains labels and value inputs
        var parametersElem = document.getElementById("triggerParameters");

        var list = event_template.triggers[triggerType].parameters;
        var keys = Object.keys(list);
        // For every parameter
        for(var i=0; i < keys.length; i++){
            // Select the corresponding input
            var paramElem = parametersElem.querySelector(`input[name="`+ keys[i] +`"]`);
            
            var value = paramElem.value;
            if(value){
                parameters.push(keys[i], value);
            } else {
                message("Some parameter has no value.");
                return;
            }            
        }

        var target = outliner_triggerOutliner.activeMyObject;

        if (!target){
            message("No target selected.");
            return;
        }
        
        // If target is not allowed
        else if (!trigger_allowedObjectTypes.includes(target.myObjectType)){
            message("Selected target object is not valid. Please select a valid target object. Possibly create it first.");
            return;
        }

        if (triggerType && parameters && target){

            let trigger;

            let activeObj = outliner_normalOutliner.activeMyObject;
            if (activeObj.myObjectType == "Trigger"){
                trigger = activeObj;
            } else {
                trigger = new Trigger(activeObj);
            }
            
            // Set trigger attributes
            Trigger.setTrigger(trigger, triggerType, parameters, target);

            turnOffOverlay('triggerCreationOverlay');

            return trigger;
        } else {
            message("Something is still missing");
        }

        
    }




    /**
     * Initialize overlay content
     */
    static overlay_initialize(){
        Trigger.overlay_initializeTriggerType();
        Trigger.overlay_initializeParameters();
        // (overlay outliner is refreshed when overlay becomes visible)
    }


    static overlay_initializeTriggerType(){
        var select = document.getElementById("selectTriggerType");

        removeElementChildren(select);
        select.onchange = function(){
            Trigger.overlay_initializeParameters();
            Outliner.refresh();
        };

        var list = Object.keys(event_template.triggers);
        // warning: the list is not always live when running the app on local server
        for (var i = 0; i < list.length; i++){
            var elem = htmlToElement(`<option value="` + list[i] + `">` + list[i] + `</option>`);
            select.appendChild(elem);
        }
    }

    /**
     * Initialize Trigger parameters list
     */
    static overlay_initializeParameters(){
        var parametersElem = document.getElementById("triggerParameters");
        removeElementChildren(parametersElem);

        // Get selected Triggerm type
        var selectElem = document.getElementById("selectTriggerType");
        var selectedTriggerType = selectElem.value;

        var list = event_template.triggers[selectedTriggerType].parameters;
        var keys = Object.keys(list);

        for (var i = 0; i < keys.length; i++){

            // Create parameter label and value input
            var elem = htmlToElement(
            `<div class="horizontalItems">` 
                + `<label>` + keys[i] + `:` + `</label>` 
                + `<input name="`+ keys[i] +`" type="number" value="` + list[keys[i]] + `" step="0.1">
            </div>`
            );

            parametersElem.appendChild(elem);
        }

    }

    /**
     * Get list of types of allowed target MyObjects - which types are allowed depends on the selected Trigger type
     */
    static overlay_getAllowedTargetObjectTypes(){
        var selectElem = document.getElementById("selectTriggerType");
        var selectedTriggerType = selectElem.value;

        var list = [];
        if (selectedTriggerType){
            list = event_template.triggers[selectedTriggerType].compatibleObjectTypes;
        }

        return list;
    }

    /**
     * Prepare the form for editing Trigger
     */
    static startEditing(){

        // Get active object
        let trigger = outliner_normalOutliner.activeMyObject;

        // Check if it's Trigger
        if (!MyObject.assertObjectIsOfTypes(trigger, ["Trigger"])){
            return;
        }

        // Trigger type select
        var select = document.getElementById("selectTriggerType");

        let type = trigger.triggerType;

        if (type){
            select.value = type;
            select.onchange();
        }

        if (trigger.parameters){
            let parametersElem = document.getElementById("triggerParameters");

            for (let i = 0; i < trigger.parameters.length; i+=2){
                let param = trigger.parameters[i];
                let value = trigger.parameters[i+1];

                let paramElem = parametersElem.querySelector(`input[name="`+ param +`"]`);
                paramElem.value = value;
            }
        }

        if (trigger.target){
            // Fake click on target myObject in the overlay outliner
            Outliner.fakeClick(trigger.target)
        }        
        
    }


    /**
     * Find MyObject with same name as targetName
     * (Function common for both Trigger and Action)
     */
    static findTarget(targetName){
        let list = allObjectsList;
        for (let key in list){
            let obj = list[key];
            if (obj.name == targetName){
                return obj
            }
        }
        return undefined;
    }

    /**
     * Tries to find the object's target using a saved name
     * (Function common for both Trigger and Action)
     * @param {*} obj 
     */
    static refreshTarget(obj){
        let name = obj.tmpTargetName;
        
        let retTarget = Trigger.findTarget(name)
        if (retTarget == undefined){
            // console.log("Couldn't find target of " + obj._getDisplayName());
        } else {
            // console.log("Found target of " + obj._getDisplayName());
        }
        obj.target = retTarget;
    }

    /**
     * Display help message in a new window
     */
    static help(){
        helpMessage(
        `To create a Trigger you need to: 
        1) Choose a Trigger type.
        2) Specify Trigger parameters. The parameters available depend on the chosen Trigger type.
        3) Choose a Trigger target. Allowed target objects depend on the chosen Trigger type. Objects that are currently not allowed are grey.`
        );
    }



    _serializeIntoJson(item){

        item.triggerType = this.triggerType;
        item.parameters = this.parameters;
        item.targetName = this.target.name;



        return item;
        

    }

    _deserializeFromJson(item) {

        this.triggerType = item.triggerType;
        this.parameters = item.parameters;

        // Save targetName to be able to find the target myObject later
        this.tmpTargetName = item.targetName;

        Trigger.refreshTarget(this);
        
        if (this.target == undefined){
            // message("couldnt find target")
            console.log("Couldnt find target, maybe the target object didn't finish loading yet")
        }
        
     }

}
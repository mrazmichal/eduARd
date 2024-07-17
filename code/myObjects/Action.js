/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


// list of allowed target types - is updated in Outliner.refresh()
var action_allowedObjectTypes;


var Action = class Action extends MyObject {
    constructor(parent, name){

        super(parent, "Action", ["Event"], name)        
        
    }
    
    /**
     * Set attributes of the object
     */
    static setAction(action, actionType, parameters, target){
        action.actionType = actionType;
        action.parameters = parameters;
        if (target == undefined){
            console.error("target undefined");
        }
        action.target = target;        
        action.tmpTargetName = target.name;
    }

    static createActionFromForm(){

        var actionType = document.getElementById("selectActionType").value;

        var parameters = [];
        var parametersElem = document.getElementById("actionParameters");

        var list = event_template.actions[actionType].parameters;
        var keys = Object.keys(list);
        for(var i=0; i < keys.length; i++){
            var paramElem = parametersElem.querySelector(`input[name="`+ keys[i] +`"]`);
            
            var value = paramElem.value;
            if(value){
                parameters.push(keys[i], value);
            } else {
                console.log("No value?!");
                return;
            }            
        }

        var target = outliner_actionOutliner.activeMyObject;

        if (!target){
            console.log("missing target");
            return;
        }
        // If target is not allowed
        else if (!action_allowedObjectTypes.includes(target.myObjectType)){
            console.log("invalid target");
            message("Selected target can't be used with the selected Trigger type. Please choose (or create and then choose) a target object that is compatible with the selected Trigger type.");
            return;
        }

        if (actionType && parameters && target){

            let action;

            let activeObj = outliner_normalOutliner.activeMyObject;
            if (activeObj.myObjectType == "Action"){
                action = activeObj;
            } else {
                action = new Action(activeObj);
            }

            Action.setAction(action, actionType, parameters, target);

            turnOffOverlay('actionCreationOverlay');

            return action;
        } else {
            console.log("Something is still missing");
        }
   
    }

    /**
     * Initialize Action overlay
     */
    static overlay_initialize(){
        this.overlay_initializeActionType();
        this.overlay_initializeParameters();
        // (overlay outliner is refreshed when overlay becomes visible)
    }


    /**
     * Initialize Action type selection
     */
    static overlay_initializeActionType(){
        
        var select = document.getElementById("selectActionType");

        removeElementChildren(select);

        // Parameters are reloaded when selected Action type is changed
        select.onchange = function(){
            Action.overlay_initializeParameters();
            Outliner.refresh();
        };

        var list = Object.keys(event_template.actions);
        // warning: the list is not always live when on local server
        for (var i = 0; i < list.length; i++){
            var elem = htmlToElement(`<option value="` + list[i] + `">` + list[i] + `</option>`);
            select.appendChild(elem);
        }
    }

    /**
     * display list of parameters and their default value (or their current value in case we are editing)
     * @param {*} action 
     */
    static overlay_initializeParameters(){
        var parametersElem = document.getElementById("actionParameters");
        removeElementChildren(parametersElem);

        var selectElem = document.getElementById("selectActionType");
        var selectedActionType = selectElem.value;

        var list = event_template.actions[selectedActionType].parameters;
        var keys = Object.keys(list);

        for (var i = 0; i < keys.length; i++){

            var elem = htmlToElement(
            `<div>` + keys[i] + `:` + `
                <input name="`+ keys[i] +`" type="number" value="` + list[keys[i]] + `" step="0.1">
            </div>`
            );
            parametersElem.appendChild(elem);
        }

    }

    /**
     * Get allowed target object types
     */
    static overlay_getAllowedTargetObjectTypes(){
        var selectElem = document.getElementById("selectActionType");
        var selectedActionType = selectElem.value;

        console.log("selected action type")
        console.log(selectedActionType);

        var list = [];
        if (selectedActionType){
            list = event_template.actions[selectedActionType].compatibleObjectTypes;
        }

        return list;
    }


    /**
     * Prepare the form for editing / viewing Action
     */
    static startEditing(){

        console.log("started editing Action")

        let action = outliner_normalOutliner.activeMyObject;

        if (!MyObject.assertObjectIsOfTypes(action, ["Action"])){
            return;
        }

        var select = document.getElementById("selectActionType");

        let type = action.actionType;
        if (type){
            select.value = type;
            select.onchange(); // we are calling here the function-registered-as-onchange manually
        }

        if (action.parameters){
            let parametersElem = document.getElementById("actionParameters");

            for (let i = 0; i < action.parameters.length; i+=2){
                let param = action.parameters[i];
                let value = action.parameters[i+1];

                let paramElem = parametersElem.querySelector(`input[name="`+ param +`"]`);
                paramElem.value = value;
            }
        }
        if (action.target){
            console.log(action.target)
            Outliner.fakeClick(action.target)
        }
        
    }
    
    _serializeIntoJson(item){

        item.actionType = this.actionType;
        item.parameters = this.parameters;

        if (this.target == undefined){
            refreshAllTargets();
        }
        item.targetName = this.target.name;

        return item;

    }

    _deserializeFromJson(item) {
        
        this.actionType = item.actionType;
        this.parameters = item.parameters;

        // Save targetName to be able to find the target object later
        this.tmpTargetName = item.targetName;

        // (We call refreshTarget from Scenario, after loading finished)
     }

}
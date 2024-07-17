/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


// The current Scenario
var scenario;

// Counts number of objects of every MyObject type, used for naming
var scenario_namingCounters = new Map();

var Scenario = class Scenario extends MyObject{

    static currentScenarioId = undefined;
  
    constructor(){

        // Initialize counters // Placed BEFORE Scenario creation (Scenario also gets assigned name)
        Scenario.initializeNamingCounters();

        // Create special MyObject which doesn't have parent
        super(null, "Scenario", null);
        
        // Create global reference to this scenario
        scenario = this;

        //set a placeholder path
        Scenario.setResourcePath(this);

        Outliner.refresh();

        Outliner.fakeClick(this);
        
        // Counts number of things being loaded right now
        this.loadingCounter = 0;
    }


    /**
     * Set every counter to zero
     */
    static initializeNamingCounters(){
        scenario_namingCounters.set("Scenario", 0);
        scenario_namingCounters.set("Scene", 0);
        scenario_namingCounters.set("Marker", 0);
        scenario_namingCounters.set("GPS", 0);
        scenario_namingCounters.set("Locator", 0);
        scenario_namingCounters.set("Annotation", 0);
        scenario_namingCounters.set("Model", 0);
        scenario_namingCounters.set("ModelPart", 0);
        scenario_namingCounters.set("MyObject_Animation", 0);
        scenario_namingCounters.set("Button", 0);
        scenario_namingCounters.set("Event", 0);
        scenario_namingCounters.set("Trigger", 0);
        scenario_namingCounters.set("Action", 0);
        scenario_namingCounters.set("Video", 0);
        scenario_namingCounters.set("Picture", 0);
    }
    

    /**
     * Initialize naming counters according to loaded Scenario
     */
    setNamingCounters(item){
        let counters = item["namingCounters"]
        for (let key in counters){
            scenario_namingCounters.set(key, counters[key])
        }
    }

    /**
     * Not used
     */
    static setResourcePath(object){
        object.resourcePath = "path/to/resources";
    }

    /**
     * Refreshes things when Scenario is loaded
     */
    static gotFocused(){        

        // Get x3dom element holding anchors
        var anchors = document.getElementById("anchors");
        // Make anchors invisible        
        X3domLib.makeListInvisible(anchors.childNodes);
        
        // Refresh
        Outliner.refresh();
        Gizmo.refresh();

        Outliner.fakeClick(scenario);
    }

    /**
     * Create JSON from object's MyObject tree
     * Specialized MyObject serialization
     * @param {JSON object} item 
     */
    _serializeIntoJson(item){
        item.resourcePath = this.resourcePath;
        item.namingCounters = {};

        // Naming counters
        for (var [key, value] of scenario_namingCounters) {
            item.namingCounters[key] = value;
        }

        // Child Scenes, serialize the MyObject tree
        Serialization.serializationHelper(item, "scenes", "Scene", true, this);

        return item;
    }

    _deserializeFromJson(item) {
        this.setNamingCounters(item)
        console.log(this)

        Scenario.gotFocused();

        this.loadingCounter += 1;

        // Recursively deserialize
        let scenes = item["scenes"]
        scenes.forEach(element => {
            Serialization.deserializeFromJson(element, this)
        })


        this.refreshTargets();

        this.loadingCounter -= 1;
    }

    /**
     * Wait until the Scenario is loaded and children of Model myObjects are created
     */
    async refreshTargets(){
        var ready = await this._isReadyForTargetDetection();

        console.log("Scenario is ready for target detection");

        // Select the first Scene when Scenario is finished loading
        var firstScene = scenario.children[0];
        if (firstScene){
            Outliner.fakeClick(firstScene);
        }

        if (!ready){
            var er = new Error("Scenario not ready for targets refresh");
            console.error(er);
            message(er);
        }

        for (var i = 0; i < allObjectsList.length; i++){
            var object = allObjectsList[i];
            if (object.myObjectType == "Action" || object.myObjectType == "Trigger"){
                Trigger.refreshTarget(object);
            }
        }
    }

    static load(id){
        return BackendAPI.downloadScenario(id)
        .then(res => {
            //important! 
            Scenario.currentScenarioId = id;

            let item = res            
            Serialization.deserializeFromJson(item)

            //important! 
            Scenario.currentScenarioId = id;
        },
        ()=>{}//{throw "Downloaded Scenario is empty"}
        )      
        .catch(error => {
            message("Couldn't load Scenario", error);
            throw error;
        })
    }

    /**
     * Save Scenario to server
     */
    static save(){

        // If we are editing a Scenario, it SHOULD already exist on server (although maybe empty)

        if (Scenario.currentScenarioId != undefined){
            const string = Serialization.stringifyScenarioJson();
            const file = new File([string], "soubor.json")
            console.log(file);
            console.log(string);
            
            BackendAPI.uploadScenario(Scenario.currentScenarioId, file).then(res => console.log(res))
        } else {
            message("Can't save Scenario, currentScenarioId undefined")
        }

    }

    static createNewScenarioFromForm(){
        let name = document.getElementById("scenarioNameInput").value;
        Scenario.create(name)
        .then(
            () => turnOffOverlay('createScenarioOverlay'),
            () => console.log("Create Scenario from form failed")
        )

    }

    static create(name){
        return BackendAPI.createScenario(name)
        .then(res => {
            console.log("Created Scenario on server", res);

            Scenario.currentScenarioId = res.id;

            new Scenario();

            Scenario.save();
        })
        .catch(() => Promise.reject())
    }

    /**
     * Delete Scenario on server
     */
    static deleteOnServer(){
        return BackendAPI.deleteScenario(Scenario.currentScenarioId)
        .catch(error => {
            message("Couldn't delete Scenario", error);
            return Promise.reject();
        })
    }

    


    /**
     * Update the Scenario selection list
     */
    static scenarioSelectionList_refresh(selectElem){
        removeElementChildren(selectElem);

        let list;

        // Get list of Scenarios from server
        return BackendAPI.getAllScenarios()
        .then(
            res => {
                list = res;
                createOptions(list);

                console.log("Scenario selection list refresh");
            }
        )
        .catch(error => {
            message("Couldn't fetch list of Scenarios", error);
            return Promise.reject();
        })

        function createOptions(list){
            
            // Display Scenario name to user, internally use Scenario id
            for (var i = 0; i < list.length; i++){
                var elem = htmlToElement(`<option value= ${list[i].id} > ${list[i].name} </option>`);
                selectElem.appendChild(elem);
            }

        }

    }

    static assetList_refresh(){
        let select = selectAsset;
        let type = AssetType.ALL;

        assetSelect_refresh(select, type);
    }

    /**
     * Delete asset on server
     */
    static deleteAsset(){
        let select = selectAsset;
        let assetId = select.value;

        if (checkIfAssetIsBeingUsed(assetId)){
            message_assetIsUsed();
            return;
        }

        BackendAPI.deleteScenarioAsset(assetId)
        .then(
            ()=>{
                console.log("deleted asset")
                Scenario.assetList_refresh();
            }, 
            ()=>message("Couldn't delete asset")
        )

    }

    /**
     * Delete Scenario on server (from scenario management overlay)
     */
    static deleteScenario(){
        let select = scenarioManagementSelect;
        let scenarioId = select.value;

        BackendAPI.deleteScenario(scenarioId)
        .then(
            ()=>{
                console.log("deleted Scenario")
                Scenario.scenarioManagement_refresh();
            }, 
            ()=>message("Couldn't delete Scenario")
        )
    }

    /**
     * Rename Scenario on server
     */
    static renameScenario(){
        let select = scenarioManagementSelect;
        let scenarioId = select.value;

        let newName = scenarioRenameInput.value;
        if (newName.length <= 0){
            message("The new name is empty!");
            return;
        }

        BackendAPI.renameScenario(scenarioId, newName)
        .then(
            ()=>{
                console.log("renamed Scenario");
                Scenario.scenarioManagement_refresh();
            }, 
            ()=>message("Couldn't rename Scenario")
        )
    }

    static async scenarioManagement_refresh(){
        let select = scenarioManagementSelect;

        select.onchange = function(){
            var opt = select.options[select.selectedIndex];
            scenarioRenameInput.value = opt.label; // the displayed Scenario name
        }

        await Scenario.scenarioSelectionList_refresh(select);
        select.onchange();
    }


    static loadFromForm(){
        let elem = document.getElementById("selectScenario");
        let scenarioId = elem.value;
        console.log("loading Scenario with id", scenarioId);

        //load scenario
        Scenario.load(scenarioId)
        .then(
            () => turnOffOverlay("chooseScenarioOverlay"),
            () => {}
        )
        .catch(error=>{
            console.log(error)
            while (allObjectsList.length >= 1){
                let obj = allObjectsList.pop();
                obj.delete();
            }
        })
    }

    static close(){
        MyObject.delete(scenario);
        turnOffOverlay('closingScenarioOverlay');
    }

    static delete(){
        Scenario.deleteOnServer()
        .then(
            () => {
                MyObject.delete(scenario);
                turnOffOverlay('deletingScenarioOverlay');
            },
            () => {}
        )
    }


    
}


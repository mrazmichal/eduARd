/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


// Map x3dom objects to MyObjects
var model_mappingX3domToMyObject = new Map();

// Inputs for uploading textures
var textureInputs = [];


var Model = class Model extends MyObject {
    constructor(parent, name){

        super(parent, "Model", ["Locator"], name);
        
        // X3DOM:
        // holds X3DOM content
        this.group = x3dDoc.createElement("group");
        // Model transform
        this.transform = x3dDoc.createElement("matrixTransform");
        // holds x3d model
        this.modelHolder = x3dDoc.createElement("group");
        this.modelHolder.setAttribute("onclick", "Model.clickedModel(this);");        
        
        this.group.appendChild(this.transform);
        this.transform.appendChild(this.modelHolder);

        this.textureAssetIds = [];

        // Says if X3D model was fully loaded - including Animations and ModelParts
        this.loaded = false;

        // Map modelHolder to Model
        model_mappingX3domToMyObject.set(this.modelHolder, this);

        appendModelToLocator(this, parent);
        
        /**
         * Append Model x3dom nodes to Locator x3dom nodes
         * @param {*} modelObject Model
         * @param {*} locator Locator
         */
        function appendModelToLocator(modelObject, locator){
            locator.childModelsHolder.appendChild(modelObject.group);
        }

    }


    /**
     * Process click on x3dom element (Model)
     * @param {*} elem x3dom element
     */
    static clickedModel(elem){

        // Get corresponding MyObject
        var model = model_mappingX3domToMyObject.get(elem);
        // Simulate MyObject being clicked in Outliner
        Outliner.fakeClick(model);
    }
   
    /**
     * Create Model from overlay data
     */
    static createModelFromForm() {

        let sel = document.getElementById("selectModel");
        let assetId = sel.value;
        let filename = sel.options[sel.selectedIndex].text

        return Model.createModelWithAsset(assetId, undefined, undefined, filename);
    }
    
    /**
     * Load Model
     */
    static loadWithAsset(myObject, item){
        let assetId = myObject.modelAssetId;

        return Model.createModelWithAsset(assetId, myObject, item, item.modelAssetFilename);
    }

    /**
     * Create Model using asset, create Animation and ModelPart children
     * @param {*} assetId 
     * @param {*} myObject used if loading existing Model MyObject
     * @param {*} item used if loading existing Model MyObject
     * @param {*} filename 
     */
    static async createModelWithAsset(assetId, myObject = undefined, item = undefined, filename) {

        let loading; // if loading existing Model MyObject
        let modelMyObject;

        let parentMyObject = outliner_normalOutliner.activeMyObject;

        if (myObject){
            // Use existing myObject
            modelMyObject = myObject;
            loading = true;
        } else {
            // Create new myObject
            modelMyObject = new Model(parentMyObject);
            loading = undefined;
        }

        modelMyObject.modelAssetId = assetId;
        modelMyObject.filename = filename;

        // Add file into the x3dom tree
        var inline = await Model.addX3dFile(modelMyObject, loading, item);

        await Model.waitUntilInlineLoads(inline);
        
        if (!loading){
            // Create Animation and ModelPart MyObjects, if we find any in the x3d file
            MyObject_Animation.createMyObject_AnimationsOfObject(modelMyObject);
            ModelPart.createModelPartsOfObject(modelMyObject);
        } else {
            // Children will be loaded from JSON
            let children;

            // Animations
            children = item["animations"]
            children.forEach(element => {
                Serialization.deserializeFromJson(element, modelMyObject)
            });
    
            // ModelParts
            children = item["modelParts"]
            children.forEach(element => {
                Serialization.deserializeFromJson(element, modelMyObject)
            });
            
            // Annotation
            let annotation = item["annotation"]
            if (Object.keys(annotation).length > 0){
                Serialization.deserializeFromJson(annotation, modelMyObject)
            }
            
        }

        // Model loading is done
        modelMyObject.loaded = true;
        // Inform waitUntilLoaded function
        if (modelMyObject.onLoaded_function){
            modelMyObject.onLoaded_function();
        } else {
            console.log("Model onLoaded function not defined")
        }
        
        Outliner.update();
        Gizmo.refresh();

        //fake click:
        if(!loading){
            Outliner.fakeClick(modelMyObject);
        }        

        turnOffOverlay('chooseModelOverlay');

    }


    /**
     * Add x3d file to Model
     * @param {*} modelMyObject Model MyObject
     * @param {*} filename original file name
     */
    static async addX3dFile(modelMyObject, loading, item){
        // x3d inline 
        var inline = x3dDoc.createElement("inline");

        var url;
        // url = await Model.getAssetUrl_usingFetchUrl(modelMyObject.modelAssetId);
        url = await Model.getX3dFileUrl_usingDownloadFile(modelMyObject);

        inline.setAttribute("url", url);

        // nameSpaceName is the MyObject's name to prevent possible id clashes
        inline.setAttribute("nameSpaceName", modelMyObject.name);
        inline.setAttribute("mapDEFToID", "true");

        modelMyObject.modelHolder.appendChild(inline);

        return inline;
    }


    static async getX3dFileUrl_usingDownloadFile(modelMyObject){

        // download file
        var res = await BackendAPI.downloadScenarioAsset(modelMyObject.modelAssetId)   

        let blob = res;
        if (blob == undefined){
            message("Blob is empty");
        }

        // Replace texture urls with fetchUrls
        var forLocalViewing = true;
        blob = await modifyTextureUrls_inBlob(blob, forLocalViewing, modelMyObject);

        // Create a file
        var file = makeFILEfromBlob(blob, modelMyObject.filename); // blob has no filename!
        // Return it's url
        let url = URL.createObjectURL(file);
        return url;
        
    }

    // not used yet
    static async getAssetUrl_usingFetchUrl(assetId){
        var url
        try {
            url = await getAssetFetchUrl(assetId);
        } 
        catch {
            console.error("Couldn't get asset fetch url")
        }        

        url = apiUrl + url;
        console.log(url);

        return url;
    }

    static waitUntilInlineLoads(inline){
        return new Promise(function(resolve, reject) {
            inline.addEventListener("load", ()=>resolve(inline))
        });
    }


    static uploadModelAsset(){

        let input = modelInput;
        let select = document.getElementById("selectModel");
        let type = AssetType.MODEL;

        uploadAsset(input, select, type);

    }

    static modelAssetsSelectionList_refresh(){

        let select = document.getElementById("selectModel");

        assetSelect_refresh(select, AssetType.MODEL);
   
    }

    
    /**
     * Executes after user selects a x3d file from PC, allows user to upload model textures
     */
    static async inputtedModel(){
        console.log("Inputted file");
        // get the file
        let file = modelInput.files[0];
        // find textures
        var textures = await getTextures_fromBlob(file)
        
        // make place for every texture
        Model.displayTextureInputs(textures);
        
    }

    static displayTextureInputs(textures){

        //reset
        removeElementChildren(placeForUploadingTextures);
        textureInputs = [];

        for (var i = 0; i < textures.length; i++){
            var texture = textures[i];
            var url = texture.getAttribute("url");
            var shortestUrl = extractShortestTextureUrl(url);
            Model.createPlaceForTexture(shortestUrl);
        }

        if (textureInputs.length <= 0){
            var noTexturesMessage = htmlToElement(
                `<div>no model textures detected</div>`
            )
            placeForUploadingTextures.appendChild(noTexturesMessage);
        }
    }

    static createPlaceForTexture(url){
        var row = htmlToElement(
            `
            <div class="horizontalItems_spaceBetween">
            </div>
            `
        );

        var inputWrapper = htmlToElement(
            `
            <div class="horizontalItems_onLeft">
                ${url}:
            </div>
            `
        );

        var input = htmlToElement(
            `<input type="file"/>`
        );

        var uploadButton = htmlToElement(
            `<button class="btn btn-advanced" onclick="Model.uploadTexture(this)">Upload</button>`
        )

        row.appendChild(inputWrapper);
        inputWrapper.appendChild(input);
        row.appendChild(uploadButton);

        placeForUploadingTextures.appendChild(row);
        textureInputs.push(input);          
    }

    static uploadTexture(elem){
        console.log(elem);
        var input = elem.parentNode.getElementsByTagName("input")[0]
        var file = input.files[0];
        
        uploadTexture(file);
        
    }

    _serializeIntoJson(item){

        Serialization.serializationHelper(item, "annotation", "Annotation", false, this);

        var transforms = X3domLib.getTransformsFromMatrixTransform(this.transform);
        item.translation = transforms.t;
        item.rotation = transforms.r;
        item.scale = transforms.s;

        console.log(this.filename)
        item.modelAssetFilename = this.filename;
        item.modelAssetId = this.modelAssetId;

        Serialization.serializationHelper(item, "modelParts", "ModelPart", true, this);
        Serialization.serializationHelper(item, "animations", "MyObject_Animation", true, this);


        return item;
        

    }

    _deserializeFromJson(item) {

        let t = item.translation;
        let r = item.rotation;
        let s = item.scale;

        Outliner.fakeClick(this);

        let quat = new x3dom.fields.Quaternion(r.x, r.y, r.z, r.w);
        let eulerRotation = X3domLib.getEulerXyzFromQuaternion(quat);

        Gizmo.setGizmoTranslation(t);
        Gizmo.setGizmoRotation(eulerRotation);
        Gizmo.setGizmoScale(s);

        // This is the empty Model myObject
        this.modelAssetId = item.modelAssetId;
        this.filename = item.modelAssetFilename;

        Model.loadWithAsset(this, item);


        //IMPORTANT: children are deserialized from JSON after inline model loads


    }

    _checkIfAssetUsed(assetId) {
        // if the model is the asset
        if (this.modelAssetId == assetId){
            return true;
        }
        if (this.isAssetInTextures(assetId)){
            return true;
        }
        return false;
    }

    isAssetInTextures(assetId){
        for (var i = 0; i < this.listOfTextureAssetIds.length; i++){
            if (this.listOfTextureAssetIds[i] == assetId){
                return true;
            }
        }
        return false;
    }

    async waitUntilLoaded(){
        var model = this;

        return new Promise(function(resolve, reject) {
            if (model.loaded){
                resolve(true);
            }

            model.onLoaded_function = () => resolve(true);

        });
    }

    /**
     * Overwrite function from MyObject
     */
    async _isReadyForTargetDetection(){
        await this.waitUntilLoaded();
        return true;
    }

}
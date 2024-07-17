/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


var Picture = class Picture extends MyObject{

    constructor(parent, name){

        super(parent, "Picture", ["Scene"], name);   

    }

    static createPictureFromForm(){

        let sel = document.getElementById("selectPicture");

        let assetId = sel.value;
        let filename = sel.options[sel.selectedIndex].text

        // Download asset - could be replaced with fetchUrl
        // BackendAPI.downloadScenarioAsset(assetId)
        // .then(blob => filename = blob.filename)
        // .catch(error => message("Error when downloading asset", error))

        let object = new Picture(outliner_normalOutliner.activeMyObject);
        Picture.initializePicture(object, assetId, filename);

        turnOffOverlay('createPictureOverlay');
    }

    /**
     * Set attributes, refresh outliner and select the myObject
     */
    static initializePicture(object, assetId, filename){
        
        object.assetId = assetId;
        object.filename = filename;

        Outliner.refresh();
        Outliner.fakeClick(object);        
    }


    static uploadImageAsset(){

        let input = document.getElementById("openPicture");
        let select = document.getElementById("selectPicture");
        let type = AssetType.IMAGE;

        uploadAsset(input, select, type);

    }

    static pictureAssetsSelectionList_refresh(){
        
        let select = document.getElementById("selectPicture");
        let type = AssetType.IMAGE;

        assetSelect_refresh(select, type);
        
    }

    /**
     * Add properties to item that are specific to this MyObject type
     * @param {JSON this} item 
     */
    _serializeIntoJson(item){

        item.assetId = this.assetId;
        item.filename = this.filename;
        
        return item;
    }

    _deserializeFromJson(item) {

        Picture.initializePicture(this, item.assetId, item.filename);
        
    }

    _checkIfAssetUsed(id) {
        return this.assetId == id;
    }
}

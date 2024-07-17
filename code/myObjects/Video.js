/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


var Video = class Video extends MyObject {

    constructor(parent, name){

        super(parent, "Video", ["Scene"], name);   

    }

    
    static createVideoFromForm(){

        let sel = document.getElementById("selectVideo");

        // Video asset id
        let assetId = sel.value;
        let filename = sel.options[sel.selectedIndex].text
        
        // Download the asset:
        // BackendAPI.downloadScenarioAsset(assetId)
        // .then(blob => filename = blob.filename)
        // .catch(error => message("Error when downloading asset", error))

        let object = new Video(outliner_normalOutliner.activeMyObject);
        Video.initializeVideo(object, assetId, filename);
        
        turnOffOverlay('createVideoOverlay');

    }

    /**
     * Set attributes, refresh outliner, select Video myObject
     */
    static initializeVideo(object, assetId, filename){
        
        object.assetId = assetId;
        object.filename = filename;

        Outliner.refresh();
        Outliner.fakeClick(object);        
    }

    
    /**
     * Upload video file to server
     */
    static uploadVideoAsset(){

        let input = document.getElementById("openVideo");
        let select = document.getElementById("selectVideo");
        let type = AssetType.VIDEO;

        uploadAsset(input, select, type);

    }

    /**
     * Refresh videos select
     */
    static videoAssetsSelectionList_refresh(){
        
        let select = document.getElementById("selectVideo");
        let type = AssetType.VIDEO;

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

        Video.initializeVideo(this, item.assetId, item.filename);
        
    }

    _checkIfAssetUsed(id) {
        return this.assetId == id;
    }




     

}

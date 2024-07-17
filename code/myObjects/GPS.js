/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


var GPS = class GPS extends Anchor {
  
    constructor(parent, name){

        super(parent, "GPS", ["Scene"], name);

        // group - here we store the x3dom representation of GPS 
        this.group = x3dDoc.createElement("group");
        GPS.appendToScene(this);

        // gpsCoordinates property value will be assigned somewhere else; Used in JSON serialization
        this.gpsCoordinates = null;

    }

    // starting point for creation from overlay
    static createGpsFromOverlay(){

        let selectedObject = outliner_normalOutliner.activeMyObject;

        let anchor;

        // If selected object is GPS
        if (selectedObject.myObjectType == "GPS"){
            // We are editing
            anchor = selectedObject;
            anchor.gpsCoordinates = null;            
            // We remove old x3d content from the anchor's x3d group (that group is still appended to all anchors x3d group)
            removeElementChildren(anchor.group)

        } else {
            // We create a new GPS object
            let scene = outliner_normalOutliner.activeMyObject;
            anchor = new GPS(scene);
        }

        anchor.afterCreateGps()
        
    }

    /**
     * The deserialization starting point
     */
    async afterCreateGps(){
        let scene = this.parent
        let anchor = this

        Scene.setActive(scene);

        await createAndShowHousesAndTerrain(this)

        if (outliner_normalOutliner.activeMyObject == anchor || outliner_normalOutliner.activeMyObject == scene){
            Outliner.fakeClick(anchor);
        }

        Outliner.refresh();
        Scene.displayOnlyGivenScene(scene);
        Gizmo.refresh();

        // If the anchor is selected in outliner
        if (outliner_normalOutliner.activeMyObject == anchor) 
        {
            Outliner.showObject(anchor);
        }

        turnOffOverlay('chooseGpsOverlay');
    }

    /**
     * Prepare overlay content - when editing
     */
    static edit(){
        // Put map marker on current GPS position
        var gpsObject = outliner_normalOutliner.activeMyObject;
        var lat = gpsObject.gpsCoordinates.lat;
        var lng = gpsObject.gpsCoordinates.lng;
        mapFakeClick(lat, lng);
        turnOnOverlay('chooseGpsOverlay');
    }

    
    _serializeIntoJson(item){

        item.gpsCoordinates = this.gpsCoordinates;

        Serialization.serializationHelper(item, "locators", "Locator", true, this);

        return item;
    }

    _deserializeFromJson(item) {
        // coordinates
        this.gpsCoordinates = item["gpsCoordinates"]

        // (is asynchronous)
        this.afterCreateGps();

        //locators
        let children = item["locators"]
        children.forEach(element => {
            Serialization.deserializeFromJson(element, this)
        });

    }


}


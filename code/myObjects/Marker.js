/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/



var Marker = class Marker extends Anchor {

    constructor(parent, name){

        super(parent, "Marker", ["Scene"], name);

        // group - for x3dom related things
        this.group = x3dDoc.createElement("group");
        Marker.appendToScene(this);

    }

    /**
     * Create Marker from overlay data
     */
    static createMarkerFromForm() {

        let sel = document.getElementById("selectMarkerImage");

        var orientation;
        var width;
        var url;
        var filename;

        // type
        var radios = document.getElementsByName('markerType');
        for (var i = 0; i < radios.length; i++) {
            if (radios[i].checked) {
                orientation = radios[i].value;
                break;
            }
        }

        // width
        width = markerWidth.value;


        // Image asset
        // Get asset id from select element - selected item's value
        let assetId = sel.value
        // console.log("asset id:", assetId);
        let selectedIndex = sel.selectedIndex;        
        filename = sel.options[sel.selectedIndex].text
        // console.log(filename);

        let scene = scene_active;

        let selectedObject = outliner_normalOutliner.activeMyObject;
        let marker;
        if (selectedObject.myObjectType == "Marker"){
            // We are editing
            marker = selectedObject;
            removeElementChildren(marker.group);
        } else {
            // We are creating new Marker object
            marker = new Marker(scene);
        }
        
        Marker.createMarker(scene, orientation, width, filename, assetId, marker)
        .then(()=>{
            turnOffOverlay('chooseMarkerOverlay');
            Outliner.fakeClick(marker);  
        })


    }


    //https://stackoverflow.com/questions/11442712/get-width-height-of-remote-image-from-url
    //sets the real size of the image elements (in metres)

    /**
     * Sets Marker image and Marker real-world sizes
     */
    static setRealSizeOfImage(url, realWidth, target) {

        // Loads image
        var img = new Image();
        img.src = url;
        // Wait until image loads
        img.onload = function () {
            processImageSizes(this.width, this.height, realWidth, target);
        }

        /**
         * Sets Marker real-world sizes
         * @param {*} imgWidth image width in pixels
         * @param {*} imgHeight image height in pixels
         * @param {*} realWidth real world Marker width (inputted by user)
         * @param {*} target Marker myObject
         */
        function processImageSizes(imgWidth, imgHeight, realWidth, target) {

            //converts image resolution to world size
            var factor = (realWidth * 1.0) / (imgWidth * 1.0);
            var realHeight = imgHeight * factor;

            //applies size to the image element (and it's backside)
            target.setAttribute("size", realWidth + ", " + realHeight);
        }

    }


    /**
     * Create Marker
     * @param {*} scene MyObject
     * @param {*} orientation marker type - floor, wall or ceiling
     * @param {*} width Marker real-world width
     * @param {*} filename image filename
     * @param {*} assetId id of image file asset
     * @param {*} marker MyObject
     */
    static createMarker(scene, orientation, width, filename, assetId, marker) { //type is wall, floor etc.        

        // Data needed for myObject serialization
        marker.markerType = orientation;
        marker.markerWidth = width;
        marker.markerImageFilename = filename;
        marker.markerImageAssetId = assetId;

        let url;

        // Get asset list
        return BackendAPI.getAllScenarioAssets(Scenario.currentScenarioId)
        .then(res => {     
            let assetObject;
            // Find our asset in the list
            for (var i = 0; i < res.length; i++){
                var item = res[i];
                if (item.id == assetId){
                    assetObject = item;
                    break;
                }
            }

            if (assetObject == undefined){
                message("Couldn't load Marker image - asset not found");
                return;
            }

            url = apiUrl + assetObject.fetchUrl;

            createMarkerImageElement();
            createMarkerBacksideElement();
        
        },
        ()=>message("Couldn't load Marker image - couldn't fetch assets list"))


        // Alternative version that downloads the asset:
        // return BackendAPI.downloadScenarioAsset(assetId)
        // .then(res => {     
        //     let blob = res;
        //     if (blob == undefined){
        //         message("Blob is empty");
        //     }

        //     url = URL.createObjectURL(blob);

        //     createMarkerImageElement();
        //     createMarkerBacksideElement();
        
        // },
        // ()=>message("Couldn't load Marker image"))



        /**
         * Create Marker X3DOM representation
         */
        function createMarkerImageElement() {
            var transform = x3dDoc.createElement("transform");
            var shape = x3dDoc.createElement("shape");
            var appearance = x3dDoc.createElement("appearance");

            var imageTexture = x3dDoc.createElement("ImageTexture");

            var plane = x3dDoc.createElement("plane");
            plane.setAttribute("size", "16, 16");

            //the real size is set later after loading image info
            Marker.setRealSizeOfImage(url, width, plane);

            switch (orientation) {
                case "floor":
                    transform.setAttribute("rotation", "1 0 0 -1.57");
                    break;
                case "wall":
                    transform.setAttribute("rotation", "1 0 0 0");
                    break;
                case "ceiling":
                    transform.setAttribute("rotation", "1 0 0 1.57");
                    break;
            }

            imageTexture.setAttribute("url", url);

            transform.appendChild(shape);
            shape.appendChild(appearance);
            appearance.appendChild(imageTexture);

            shape.appendChild(plane);

            // Append X3DOM representation to Marker
            marker.group.appendChild(transform);

            Outliner.refresh();
        }

        /**
         * Create Marker backside
         */
        function createMarkerBacksideElement() {
            var transform = x3dDoc.createElement("transform");
            var shape = x3dDoc.createElement("shape");
            var appearance = x3dDoc.createElement("appearance");

            var material = x3dDoc.createElement("material");

            var plane = x3dDoc.createElement("plane");
            plane.setAttribute("size", "16, 16");

            //the real size is set later after loading image info
            Marker.setRealSizeOfImage(url, width, plane);

            switch (orientation) {
                case "floor":
                    transform.setAttribute("rotation", "1 0 0 1.57");
                    break;
                case "wall":
                    transform.setAttribute("rotation", "1 0 0 3.14");
                    break;
                case "ceiling":
                    transform.setAttribute("rotation", "1 0 0 -1.57");
                    break;
            }

            material.setAttribute("diffuseColor", "0.65 0.65 0.93");

            transform.appendChild(shape);
            shape.appendChild(appearance);
            appearance.appendChild(material);

            shape.appendChild(plane);

            marker.group.appendChild(transform);
        }


    }


    
    _serializeIntoJson(item){

        item.markerOrientation = this.markerType;
        item.imageAssetFilename = this.markerImageFilename;
        item.width = this.markerWidth;
        item.imageAssetId = this.markerImageAssetId;

        // Finds all Locator children of this Marker and puts them as list into item's property "locators"
        Serialization.serializationHelper(item, "locators", "Locator", true, this);

        return item;
    }

    _deserializeFromJson(item) {
        
        Marker.createMarker(scene_active, item.markerOrientation, item.width, item.imageAssetFilename, item.imageAssetId, this)

        //locators
        let children = item["locators"]
        children.forEach(element => {
            Serialization.deserializeFromJson(element, this)
        });

    }


    static uploadImageAsset(){

        let input = openMarkerImage;
        let select = selectMarkerImage;
        let type = AssetType.IMAGE;

        uploadAsset(input, select, type);

    }

    static pictureAssetsSelectionList_refresh(){
        
        let select = selectMarkerImage;
        let type = AssetType.IMAGE;

        assetSelect_refresh(select, type);

    }

    /**
     * Returns true if the given asset id is the same as this Marker's image asset id
     * @param {*} id asset id
     */
    _checkIfAssetUsed(id) {
        return this.markerImageAssetId == id;
    }


}


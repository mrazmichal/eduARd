/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


// Currently active scene
var scene_active; 

var Scene = class Scene extends MyObject{
    constructor(parent, name){

        super(parent, "Scene", ["Scenario"], name);

        scene_active = this;

        // Needs to be called again because there was probably no active scene before
        Outliner.refresh();
        
        Outliner.fakeClick(this);

    }

    /**
     * Set active Scene
     */
    static setActive(scene){
        scene_active = scene;
    }

    /**
     * Display only content of a single scene
     */
    static displayOnlyGivenScene(scene){

        // Get x3dom element holding anchors
        var anchors = document.getElementById("anchors");
        // Make anchors invisible
        X3domLib.makeListInvisible(anchors.childNodes);

        // Get the first (and it should be the only) anchor from scene's children
        var anchor;
        for (var i = 0; i < scene.children.length; i++){
            var child = scene.children[i];
            if (MyObject.checkIfObjectIsOfTypes(child, ["Marker", "GPS"])){
                anchor = child;
                break;
            }
        }
        if (anchor){
            X3domLib.makeNodeVisible(anchor.group);
        }

        // Locators
        var locators = document.getElementById("locators");
        X3domLib.makeListInvisible(locators.childNodes);
        if (anchor){
            for(var i = 0; i < anchor.children.length; i++){
                X3domLib.makeNodeVisible(anchor.children[i].group);
            }
        }   

    }

    /**
     * Switch focus to this scene
     */
    static gotFocused(scene){
        Scene.setActive(scene);
        Scene.displayOnlyGivenScene(scene);
    }


    /**
     * Create new Scene
     */
    static createScene(){

        // Create Scene with parent scenario
        var scene = new Scene(scenario);        
        Scene.gotFocused(scene);

        return scene;
    }

    static delete(scene){
        MyObject.delete(scene);
    }

    _serializeIntoJson(item){

        // Get list of Annotations in children, serialize the first one and assign it to item.annotation
        Serialization.serializationHelper(item, "annotation", "Annotation", false, this);

        // If the Scene has a Marker child, serialize it. Otherwise serialize a GPS child.
        var markers = Serialization.getChildrenWithType("Marker", this);
        if (markers.length > 0){
            Serialization.serializationHelper(item, "anchor", "Marker", false, this);
        } else {
            Serialization.serializationHelper(item, "anchor", "GPS", false, this);
        }

        // Create arrays of myObjects
        Serialization.serializationHelper(item, "events", "Event", true, this);
        Serialization.serializationHelper(item, "pictures", "Picture", true, this);
        Serialization.serializationHelper(item, "videos", "Video", true, this);

        return item;        

    }

    _deserializeFromJson(item) {

        Scene.gotFocused(this)

        // Children: anchor, annotation, events, pictures, videos        
        let anchor = item["anchor"]
        if (Object.keys(anchor).length > 0){
            Serialization.deserializeFromJson(anchor, this)
        }

        let annotation = item["annotation"]
        if (Object.keys(annotation).length > 0){
            Serialization.deserializeFromJson(annotation, this)
        }

        let pictures = item["pictures"]
        pictures.forEach(element => {
            Serialization.deserializeFromJson(element, this)
        });

        let videos = item["videos"]
        videos.forEach(element => {
            Serialization.deserializeFromJson(element, this)
        });

        // Events need to be processed last, because they reference other MyObjects
        let events = item["events"]
        events.forEach(element => {
            Serialization.deserializeFromJson(element, this)
        });
        
     }


}


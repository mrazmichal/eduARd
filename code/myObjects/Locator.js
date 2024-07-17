/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


var locator_mappingX3domToMyObject = new Map();


var Locator = class Locator extends MyObject {
    constructor(parent, name){

        super(parent, "Locator", ["Marker", "GPS"], name);

        //x3dom elements: --------------------------------
        this.group = x3dDoc.createElement("group");
        
        this.transform = x3dDoc.createElement("matrixTransform");
    
        this.childModelsHolder = x3dDoc.createElement("group");
        this.locatorModel = htmlToElement(
        `
        <transform scale='0.4 0.4 0.4'>
            <shape>
                <appearance>
                    <material diffuseColor='1 0 0'></material>
                </appearance>
                <sphere></sphere>
            </shape>
        </transform>
        `
        );
        this.locatorModel.setAttribute("onclick", "Locator.clickedLocator(this);");
        
        this.group.appendChild(this.transform);

        // Locator model has it's own additional transform for scaling dependent on camera distance
        this.locatorTransform = x3dDoc.createElement("transform");
        this.locatorTransform.appendChild(this.locatorModel);
        this.transform.appendChild(this.locatorTransform);        

        this.transform.appendChild(this.childModelsHolder);
        //------------------------------------------------------------------------

        
        locator_mappingX3domToMyObject.set(this.locatorModel, this);

        addLocatorToScene(this);

            
        /**
         * Add Locator x3dom elements to the main x3dom tree
         * @param {Locator} locator 
         */
        function addLocatorToScene(locator){
            var locatorsElem = document.getElementById("locators");
            locatorsElem.appendChild(locator.group);
        }
        
        
    }
    

    static createNewLocator(myObject){
        var locator = new Locator(myObject);

        Outliner.fakeClick(locator);
    }

    /**
     * Clicked 3D representation of Locator
     */
    static clickedLocator(elem){
        // Fake outliner click
        var locator = locator_mappingX3domToMyObject.get(elem);
        Outliner.fakeClick(locator);
    }


    _serializeIntoJson(item){

        Serialization.serializationHelper(item, "annotation", "Annotation", false, this);
        item.translation = X3domLib.getTransformsFromMatrixTransform(this.transform).t;
        Serialization.serializationHelper(item, "models", "Model", true, this);
        Serialization.serializationHelper(item, "buttons", "Button", true, this);

        return item;
        
    }
    
    _deserializeFromJson(item) {

        Outliner.fakeClick(this);

        // We set gizmo's translation, it in turn sets the manipulated object's translation
        Gizmo.setGizmoTranslation(item.translation);

        let annotation = item["annotation"]
        if (Object.keys(annotation).length > 0){
            Serialization.deserializeFromJson(annotation, this)
        }

        let buttons = item["buttons"]
        buttons.forEach(element => {
            Serialization.deserializeFromJson(element, this)
        });

        let models = item["models"]
        models.forEach(element => {
            Serialization.deserializeFromJson(element, this)
        });

     }
}
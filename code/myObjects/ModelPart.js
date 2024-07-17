/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/

/**
 * ModelPart myObject is automatically constructed for some nodes in an x3d model. These nodes have to have a "modelPart_" prefix in their id.
 */
var ModelPart = class ModelPart extends MyObject{

    constructor(parent, name){

        super(parent, "ModelPart", ["Model"], name);
        
    }


    /**
     * Attach x3d node to ModelPart MyObject and keep some info about the node (nickname, x3dId)
     * @param {MyObject} modelPart 
     * @param {x3d node} x3dNode 
     * @param {MyObject} model 
     */
    static addX3dNode(modelPart, x3dNode, model){
        // As nickname we keep the modelPart name without any prefixes
        modelPart.modelPartNode = x3dNode;
        let regex = new RegExp('^(' + model.name + '__modelPart_)')
        modelPart.nickname = modelPart.modelPartNode.id.replace(regex, ""); // remove name of the inline namespace and modelPart prefix
        
        // We keep the x3d ID with "modelPart_" prefix - that's how it's called in the source x3d file
        regex = new RegExp('^(' + model.name + '__)')
        modelPart.x3dId = modelPart.modelPartNode.id.replace(regex, "");        
    }

    
    /**
     * Find nodes labeled "modelPart" in Model, create ModelParts MyObjects (and append them to Model)
     * @param {*} modelMyObject Model
     */
    static createModelPartsOfObject(modelMyObject){

        // Find all x3dom elements which are labelled as modelPart

        // We use modelMyObject.name because that's the inline node's namespaceName
        var modelPartsList = modelMyObject.modelHolder.querySelectorAll('*[id^="' + modelMyObject.name + '__modelPart_"]');
        console.log(modelMyObject.modelHolder);

    
        for (var i = 0; i < modelPartsList.length; i++){
            // Create new ModelPart
            var modelPart = new ModelPart(modelMyObject);

            var x3dNode = modelPartsList[i];
            ModelPart.addX3dNode(modelPart, x3dNode, modelMyObject);
        }

        Outliner.update();

    }


    _serializeIntoJson(item){

        Serialization.serializationHelper(item, "annotation", "Annotation", false, this);

        item.x3dId = this.x3dId;

        return item;       
    }


    _deserializeFromJson(item) {
        
        // X3d id including modelPart_ prefix
        this.x3dId = item.x3dId;

        let modelPart = this;
        // Using the namespace prefix and id to find the x3d node
        let node = document.getElementById(this.parent.name + "__" + this.x3dId)
        
        this.modelPartNode = node;

        let annotation = item["annotation"]
        if (Object.keys(annotation).length > 0){
            Serialization.deserializeFromJson(annotation, this)
        }
        
     }
}

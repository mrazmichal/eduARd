/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


var Annotation = class Annotation extends MyObject{

    constructor(parent, name){

        super(parent, "Annotation", ["Locator", "Model", "ModelPart"], name);
        
    }


    /**
     * Process the Annotation creation overlay data
     */
    static process_annotationCreationOverlay(){
        var string = annotationCreationOverlay_textarea.value;
        var object = outliner_normalOutliner.activeMyObject;

        let annotation;

        if (object.myObjectType == "Annotation"){
            annotation = object
        } else {
            annotation = this.createAnnotation(object);
        }
        
        console.log(string);

        Annotation.setText(annotation, string);
    }


    static setText(annotation, string){
        annotation.textString = string;
    }

    static createAnnotation(parent){

        return new Annotation(parent);      

    }

    /**
     * Prepare content of Annotation editing overlay
     */
    static startEditing(){
        let object = outliner_normalOutliner.activeMyObject;
        if (object.myObjectType == "Annotation"){
            annotationCreationOverlay_textarea.value = object.textString;
        } else {
            throw Error("the object is not Annotation!")
        }
        
    }



    _serializeIntoJson(item){
        item.content = this.textString;        

        return item;
    }

    _deserializeFromJson(item) {
        this.textString = item.content;
     }

}

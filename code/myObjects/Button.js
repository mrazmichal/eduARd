/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


var Button = class Button extends MyObject {

    constructor(parent, name){

        super(parent, "Button", ["Locator"], name);

    }

    static createButton(){
        new Button(outliner_normalOutliner.activeMyObject);
        Outliner.refresh();
    }
    
    _serializeIntoJson(item){
        return item;
    }

    _deserializeFromJson(item) {
        
     }
}

/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


var event_template;

var Event = class Event extends MyObject {
    constructor(parent, name){

        super(parent, "Event", ["Scene"], name);
        
    }

    //load Event template
    //Event template provides possible options for Trigger MyObject and Action MyObject
    static async loadEventTemplate(){
        var url = 'code/EventJSON.json';

        var response = await fetch(url, {
			method: 'GET'
        })
        
        if (!response.ok){
            var er = new Error("Couldn't download OSM data.");
            message(er);
            return;
        }

        event_template = JSON.parse(await response.text());

    }

    static createEvent(){
        var event = new Event(outliner_normalOutliner.activeMyObject);
            
        Outliner.refresh();
        Outliner.fakeClick(event);
    }

    _serializeIntoJson(item){

        Serialization.serializationHelper(item, "triggers", "Trigger", true, this);
        Serialization.serializationHelper(item, "actions", "Action", true, this);

        return item;
    }

    _deserializeFromJson(item) {
        Outliner.refresh();
        Outliner.fakeClick(event);

        let children = item["actions"]
        children.forEach(element => {
            Serialization.deserializeFromJson(element, this)
        });

        children = item["triggers"]
        children.forEach(element => {
            Serialization.deserializeFromJson(element, this)
        });

    }        
}
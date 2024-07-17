/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


/**
 * Animation myObject is automatically constructed when we find a timeSensor node in an X3D model
 */
var MyObject_Animation = class MyObject_Animation extends MyObject{

    constructor(parent, name){

        super(parent, "MyObject_Animation", ["Model"], name);     
        
    }


    static disableMyObject_Animation(anim){
        if (checkIfObjectType(anim, "MyObject_Animation")){
            anim.timeSensor.setAttribute("enabled", "false");
        }        
    }

    static enableMyObject_Animation(anim){
        if (checkIfObjectType(anim, "MyObject_Animation")){
            anim.timeSensor.setAttribute("enabled", "true");
        }        
    }


/**
 * Add timeSesnor to Animation myObject
 * @param {*} animation Animation myObject
 * @param {*} timeSensor timeSensor node in the x3d file
 * @param {*} model Model - parent myObject
 */
    static addTimeSensor(animation, timeSensor, model){
        animation.timeSensor = timeSensor;

        // Inline node namespaceName prefix
        let regex = new RegExp('^(' + model.name + '__)')
        // Remove the prefix (timeSensor.id keeps the prefix)
        animation.nickname = animation.timeSensor.id.replace(regex, "");
        animation.x3dId = animation.timeSensor.id;

        MyObject_Animation.disableMyObject_Animation(animation);
    }

    
    /**
     * Find timeSensors in Model's x3d file, create Animations MyObjects and append them to Model
     * @param {*} modelMyObject 
     */
    static createMyObject_AnimationsOfObject(modelMyObject){
        
        var timeSensorsList = modelMyObject.modelHolder.querySelectorAll("timeSensor");

        console.log(timeSensorsList)

        for(var i = 0; i < timeSensorsList.length; i++){
            var anim = new MyObject_Animation(modelMyObject);

            var timeSensor = timeSensorsList[i];
            MyObject_Animation.addTimeSensor(anim, timeSensor, modelMyObject);
        }

        Outliner.update();
    }



    _serializeIntoJson(item){
        let prefix = this.parent.name + '__';
        let prefixRegex = new RegExp('^(' + prefix + ')')
        // save the id without the prefix
        item.x3dId = this.timeSensor.id.replace(prefixRegex, "");
        
        return item;       
    }

    _deserializeFromJson(item) {
        this.x3dId = item.x3dId;

        let prefix = this.parent.name + '__';
        this.timeSensor = document.getElementById(prefix + item.x3dId);

        MyObject_Animation.disableMyObject_Animation(this)
    }


}

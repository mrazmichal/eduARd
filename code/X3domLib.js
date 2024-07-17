/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 * 
 **/



/**
 * Some functions for working with x3dom
 */
class X3domLib {
    
    /**
     * Sets list of nodes visible
     * @param {list<x3dom node>} list
     */
    static makeListVisible(list){
        for (var i = 0; i < list.length; i++){
			X3domLib.makeNodeVisible(list[i]);
		}
    }

    /**
     * Sets list of nodes invisible
     * @param {list<x3dom node>} list
     */
    static makeListInvisible(list){

        for (var i = 0; i < list.length; i++){
            
			X3domLib.makeNodeInvisible(list[i]);
		}
    }

    /**
     * Sets node as visible
     * @param {x3dom node} node 
     */
    static makeNodeVisible(node){
        node.setAttribute("render", "true");
    }

    /**
     * Sets node invisible
     * @param {x3dom node} node 
     */
    static makeNodeInvisible(node){
        node.setAttribute("render", "false");
    }


    /**
     * Gets transforms from matrix
     * @param {*} matrix 
     */
    static getTransforms(matrix){
        // If getting the matrix from some x3dom object, dont forget to transpose it!!!
        var t = new x3dom.fields.SFVec3f(); 
		var r = new x3dom.fields.Quaternion(); 
		var s = new x3dom.fields.SFVec3f();
        var so = new x3dom.fields.Quaternion();
        matrix.getTransform(t, r, s, so);
        // matrix.decompose(t, r, s, so);
        return {t:t, r:r, s:s, so:so};
    }

    /**
     * Get transforms from x3dom matrix (transposes it before that)
     * @param {*} matrixTransform 
     */
    static getTransformsFromMatrixTransform(matrixTransform){
        //if getting the matrix from some x3dom object, dont forget to transpose it!!!
        var matrix = matrixTransform.getFieldValue("matrix").transpose();
        return X3domLib.getTransforms(matrix);
    }
	

    /**
     * Get euler XYZ angles from given quaternion
     * @param {*} quat 
     */
    static getEulerXyzFromQuaternion(quat){
        var M = X3domLib.getMatrixFromQuaternion(quat);
        return X3domLib.getEulerXYZFromMatrix(M);
    }

    static getMatrixFromQuaternion(quat){
        return quat.toMatrix();
    }

    static getQuaternionFromMatrix(matrix){
        var r = X3domLib.getTransforms(matrix).r;
        return r;
    }

    /**
     * Get rotation matrix from rotation angles
     * @param {*} r Euler XYZ angles
     */
    static getMatrixFromEulerXYZ(r){
        //Euler XYZ rotation
		var rotMX = x3dom.fields.SFMatrix4f.rotationX(r.x);
		var rotMY = x3dom.fields.SFMatrix4f.rotationY(r.y);
        var rotMZ = x3dom.fields.SFMatrix4f.rotationZ(r.z);
        
        var rotM = rotMZ.mult(rotMY).mult(rotMX);
        return rotM;
    }

    /**
     * Get euler XYZ angles from rotation matrix
     * @param {*} M Rotation matrix
     */
    static getEulerXYZFromMatrix(M){
        var eulArr = M.getEulerAngles();
        var r = new x3dom.fields.SFVec3f(eulArr[0], eulArr[1], eulArr[2]);
        return r;
    }

    static makeEverythingInvisible(){
        X3domLib.makeNodeInvisible(document.getElementById("sceneContent"))
    }

    static makeEverythingVisible(){
        X3domLib.makeNodeVisible(document.getElementById("sceneContent"))
    }



    static getCameraTransforms(){
        // Code taken from https://github.com/x3dom/x3dom/issues/280
        // Plus in that isssue is also view direction, upVector, rightVector... could be helpful in future

        var vMatInv = document.getElementById("x3d").runtime.viewMatrix().inverse();
        var transforms = X3domLib.getTransforms(vMatInv);
        return transforms;
    }

    static getCameraPosition(){
        var transforms = X3domLib.getCameraTransforms();
        var cameraPosition = transforms.t;
        // return x3d.runtime.viewpoint().getAttribute("position"); // not working, this viewpoint is probably not a Viewpoint node?
        return cameraPosition;
    }

    // static getActiveViewpoint(){
    //     return document.getElementById("x3d").runtime.getActiveBindable("Viewpoint");
    // }

    static getCameraCenterOfRotation(){
        return x3d.runtime.viewpoint().getCenterOfRotation();
    }

    static getCameraDistanceFromRotationCenter(){
        var pos = X3domLib.getCameraPosition();
        var center = X3domLib.getCameraCenterOfRotation();
        var dist = Math.hypot(pos.x - center.x, pos.y - center.y, pos.z - center.z); // hypotenuse of a right angled triangle
        return dist;
    }

    static getCameraDistanceFromPoint(point){
        var camera = X3domLib.getCameraPosition();
        var dist = Math.hypot(camera.x - point.x, camera.y - point.y, camera.z - point.z); // hypotenuse of a right angled triangle
        return dist;
    }


    shaders = [];

    static removeHighlights(){
        for (var i = 0; i < this.shaders.length; i++){
            var shader = this.shaders[i];

            // TODO There's a possibility that the shader is not entirely removed and as a result the Model becomes completely black. Happened with Deer.x3d file.
            // The issue is maybe associated with creation of the shader as an HTML node - HTML tags are case-insensitive whereas X3D is case-sensitive.

            shader.parentElement.removeChild(shader);
        }
    }

    /**
     * Apply shaders - currently only applied to ModelPart myObject
     */
    static highlightSelectedObjectX3d(){

        if (this.shaders == undefined){
            this.shaders = [];
        }   

        // Remove all previously created shaders
        this.removeHighlights();
        this.shaders = [];

        var object = outliner_normalOutliner.activeMyObject;

        // var supportedMyObjectTypes = ["Model", "ModelPart", "Locator"];
        var supportedMyObjectTypes = ["ModelPart"];
        if (!supportedMyObjectTypes.includes(object.myObjectType)){
            return;
        }
        
        var objectX3d;
        switch (object.myObjectType){
            case "Model":
                objectX3d = object.group;
                break;
            case "ModelPart":
                objectX3d = object.modelPartNode;
                break;
            case "Locator":
                objectX3d = object.locatorModel;
                break;
        }

        var shapes = objectX3d.querySelectorAll("Shape"); // querySelectorAll should be case-insensitive
        for(var i = 0; i < shapes.length; i++){
            var shape = shapes[i];

            var appearance = shape.querySelector("Appearance");
            if (!appearance){
                appearance = x3dDoc.createElement("Appearance");
                shape.appendChild(appearance);
            }

            var shader = htmlToElement(shaderString);

            appearance.appendChild(shader)
            this.shaders.push(shader);            
        }
        
    }


}


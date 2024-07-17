
/**
 * * Original author:	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


/**
 * Anchor is common ancestor for GPS and Marker MyObjects
 */
var Anchor = class Anchor extends MyObject {
    
    /**
     * Appends the x3dom representation to Scene
     * @param {*} anchor MyObject - either GPS or Marker
     */
    static appendToScene(anchor){
        var e = document.getElementById("anchors");
        e.appendChild(anchor.group);
    }

}


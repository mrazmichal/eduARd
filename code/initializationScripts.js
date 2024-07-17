/**
 * Original author	Michal Mráz
 * Created:   	  	29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 * 
 * This file contains initialization scripts that run after the entire page loads.
 **/


//if (DEBUGGING == true): some debugging console logs
var DEBUGGING = false;

LoadingStateManager.initialize();

window.onload = function () { // used before: x3dom.runtime.ready = function () {

  // Add listening for keys on outliner element
  document.getElementById("outliner").addEventListener('keydown', function(event) {
    const key = event.key; // "a", "1", "Shift", etc.
    Outliner.processKeydown(key);
  });

  // Add listening for keys on first overlay outliner element
  triggerOutliner.addEventListener('keydown', function(event) {
    // event.preventDefault();
    // event.stopPropagation();

    const key = event.key; // "a", "1", "Shift", etc.
    Outliner.processKeydown(key);
  });

  // Add listening for keys on second overlay outliner element
  actionOutliner.addEventListener('keydown', function(event) {
    const key = event.key; // "a", "1", "Shift", etc.
    Outliner.processKeydown(key);
  });
  

  // Load options for Trigger and Action MyObjects
  Event.loadEventTemplate();


  

  // Initialize outliner
  var outliner = new Outliner(document.getElementById("outliner"));
  outliner_normalOutliner = outliner;
  Outliner.setActive(outliner);

  // Initialize outliner in Trigger overlay
  var outliner2 = new Outliner(document.getElementById("triggerOutliner"));
  outliner_triggerOutliner = outliner2;

  // Initialize outliner in Action overlay
  var outliner3 = new Outliner(document.getElementById("actionOutliner"));
  outliner_actionOutliner = outliner3;


  // Initialize Gizmo
  Gizmo.initialize();
  
  Outliner.update();

  
  x3d.runtime.enterFrame = function() {

    // Set speed in relation to camera distance from rotation center
    var dist = X3domLib.getCameraDistanceFromRotationCenter();
    var speedValue = dist/20;
    var topSpeedLimit = 20;
    var lowestSpeedLimit = 0.001;
    speedValue = speedValue > topSpeedLimit ? topSpeedLimit : speedValue;
    speedValue = speedValue < lowestSpeedLimit ? lowestSpeedLimit : speedValue;
    x3d.runtime.speed(speedValue); // The ideal speed probably depends on computer's performance :/ 
    
    
    // Scale 3D UI in relation to distance from camera
    var scaleCoefficient = 0.185;
    // Locators
    allObjectsList.forEach(object => {
      if (object.myObjectType == "Locator"){
        var locator = object;
        var translation = X3domLib.getTransformsFromMatrixTransform(locator.transform).t;
        var dist = X3domLib.getCameraDistanceFromPoint(translation);
        var scaleValue = dist * scaleCoefficient * 0.25;
        locator.locatorTransform.scale = new x3dom.fields.SFVec3f(scaleValue, scaleValue, scaleValue);
      }
    });
    // Gizmo
    var translation = X3domLib.getTransformsFromMatrixTransform(gizmo_matrixTransform).t;
    var dist = X3domLib.getCameraDistanceFromPoint(translation);
    var scaleValue = dist * scaleCoefficient;
    var scale = new x3dom.fields.SFVec3f(scaleValue, scaleValue, scaleValue);    
    gizmo_scalingTransform.setFieldValue("matrix", x3dom.fields.SFMatrix4f.scale(scale)); // It's important to use setFieldValue, otherwise x3dom ignores the changes

  };
   
  
  // Automatically load a scenario when starting the app
  // Scenario.load(96)

  
  // Prompt before leaving page - doesn't work when this app is inside an iframe
  // window.addEventListener('beforeunload', (event) => {
  //   event.returnValue = `Are you sure you want to leave?`;
  // });


  // An ugly "prevent scrolling" workaround
  // window.addEventListener("wheel", function(){window.scrollTo( 0, 0 );} );


}


/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


// Gizmo - used for user control of MyObject's transforms


// Whether scaling is uniform
var gizmo_UNIFORM = true;


// For x3d content
var gizmo_group;
// Simulation of Locator transform on Gizmo
var gizmo_locatorTransformSimulator
// Gizmo transform
var gizmo_matrixTransform;
var gizmo_scalingTransform;
// Gizmo model, loaded with <inline>
var gizmo_elem;

// MyObject which is currently transformed by gizmo
var gizmo_attachedMyObject; //(model)


// Old scale, rotation, translation matrices
// Remembers old transforms before user started dragging the gizmo, live transforms ("current") are then determined by applying the dragging offset to the old transforms
// Once dragging is over, old transforms are set to the value of live transforms
var gizmo_oldSMatrix = new x3dom.fields.SFMatrix4f(); 
var gizmo_oldRMatrix = new x3dom.fields.SFMatrix4f(); 
var gizmo_oldTMatrix = new x3dom.fields.SFMatrix4f();

// Current scale, rotation, translation matrices
var gizmo_currSMatrix = new x3dom.fields.SFMatrix4f();
var gizmo_currRMatrix = new x3dom.fields.SFMatrix4f();
var gizmo_currTMatrix = new x3dom.fields.SFMatrix4f();


class Gizmo {

	/**
	 * Initialize: create x3d elements, set initial transforms values, wait for gizmo model load
	 */
	static initialize() {
		
		// Group for x3d content
		gizmo_group = x3dDoc.createElement("Group");
		
		// Locator's transform is applied to gizmo
		// So gizmo is in the same location as a Model it controls - the Model is a child of some Locator, this Locator's transform we simulate here
		gizmo_locatorTransformSimulator = x3dDoc.createElement("MatrixTransform");
		// Gizmo transform
		gizmo_matrixTransform = x3dDoc.createElement("MatrixTransform");
		gizmo_scalingTransform = x3dDoc.createElement("MatrixTransform");
		// Loading gizmo model
		gizmo_elem = htmlToElement('<inline nameSpaceName="gizmo" mapDEFToID="true" url="resources/gizmo2.x3d"></inline>');
		// Refreshing gizmo transformations
		gizmo_elem.onload = function(){Gizmo.refresh();}; //console.log(`loaded Gizmo`)


		gizmo_group.appendChild(gizmo_locatorTransformSimulator);
		gizmo_locatorTransformSimulator.appendChild(gizmo_matrixTransform);
		gizmo_matrixTransform.appendChild(gizmo_scalingTransform);
		gizmo_scalingTransform.appendChild(gizmo_elem);
		document.getElementById("gizmoGroupWrapper").appendChild(gizmo_group);

		Gizmo.reset();

	}

	
	/**
	 * Set Gizmo translation	
	 * @param {*} translation x3dom.fields.SFVec3f
	 */
	static setGizmoTranslation(translation){
		// used to set Gizmo transformation from DragInput values
		// translation is in global coordinates

		// Create matrix transform from translation vector
		var tM = x3dom.fields.SFMatrix4f.translation(translation);

		// Set old and current translation
		gizmo_currTMatrix = tM;
		gizmo_oldTMatrix = gizmo_currTMatrix;
		// gizmo_oldTMatrix = gizmo_currTMatrix;

		Gizmo.applyLiveTransformations();

	}

	/**
	 * Set Gizmo rotation
	 * @param {*} rotation x3dom.fields.SFVec3f, euler XYZ rotation
	 */
	static setGizmoRotation(rotation){
		//used to set Gizmo transformation from DragInput values
		//rotation is in Euler XYZ

		// Get rotation matrix
		var M = X3domLib.getMatrixFromEulerXYZ(rotation);
		
		gizmo_currRMatrix = M;
		gizmo_oldRMatrix = gizmo_currRMatrix;
		// gizmo_oldRMatrix = gizmo_currRMatrix;


		var passive = true;
		Gizmo.applyLiveTransformations(passive);

	}

	
	/**
	 * Set Gizmo scale
	 * @param {*} scale x3dom.fields.SFVec3f
	 */
	static setGizmoScale(scale){
		// used to set Gizmo transformation from DragInput values
		
		gizmo_currSMatrix = x3dom.fields.SFMatrix4f.scale(scale);
		gizmo_oldSMatrix = gizmo_currSMatrix;

		Gizmo.applyLiveTransformations();

	}

	/**
	 * Process move event
	 * @param {*} event 
	 * @param {*} string identify axis
	 */
	static move(event, string){
		// Some code taken from https://doc.x3dom.org/tutorials/animationInteraction/transformations/index.html

		if (event.fieldName === 'translation_changed'){

			// The current Gizmo scale (not model scale)
			var scaleFactor = X3domLib.getTransformsFromMatrixTransform(gizmo_scalingTransform).s; //has x, y and z!!!

			var translation;

			switch (string){
				case "x":
					translation = new x3dom.fields.SFVec3f(event.value.x * scaleFactor.x, 0, 0);
					break;
				case "y":
					translation = new x3dom.fields.SFVec3f(0, event.value.x * scaleFactor.y, 0);
					break;
				case "z":
					translation = new x3dom.fields.SFVec3f(0, 0, event.value.x * scaleFactor.z);
					break;
			}


			var offsetM = x3dom.fields.SFMatrix4f.translation(translation);
			//simulating translation in model's local coordinates
			offsetM = gizmo_oldRMatrix.mult(offsetM).mult(gizmo_oldRMatrix.inverse());

			gizmo_currTMatrix = gizmo_oldTMatrix.mult(offsetM);



			Gizmo.applyLiveTransformations();
						

		}
		
		if (event.fieldName === 'isActive' && event.value === false){
			gizmo_oldTMatrix = gizmo_currTMatrix;
		}		
	}

	/**
	 * Process scale event
	 * @param {*} event 
	 * @param {*} string Specifies axis
	 */
	static scale(event, string){
		// Some code taken from https://doc.x3dom.org/tutorials/animationInteraction/transformations/index.html
		
		if (event.fieldName === 'translation_changed'){
			
			var factor = 1 + event.value.x;

			var scale;
			
			// Uniform scale
			if (gizmo_UNIFORM){
				scale = new x3dom.fields.SFVec3f(factor, factor, factor);
			} else {
				switch (string){
					case "x":
						scale = new x3dom.fields.SFVec3f(factor, 1, 1);
						break;
					case "y":
						scale = new x3dom.fields.SFVec3f(1, factor, 1);
						break;
					case "z":
						scale = new x3dom.fields.SFVec3f(1, 1, factor);
						break;
				}
			}			

			var offsetM = x3dom.fields.SFMatrix4f.scale(scale);

			// Modify the old scale
			gizmo_currSMatrix = gizmo_oldSMatrix.mult(offsetM);
						

			// Apply live transforms to Gizmo and MyObject
			Gizmo.applyLiveTransformations();

		}
		
		// Save if scale control element is no longer active
		if (event.fieldName === 'isActive' && event.value === false){
			gizmo_oldSMatrix = gizmo_currSMatrix;
		}		
	}

	/**
	 * Process rotation event
	 * @param {*} event 
	 * @param {*} string Which rotation axis is active
	 */
	static rotate(event, string){
		// Some code taken from https://doc.x3dom.org/tutorials/animationInteraction/transformations/index.html

		// If the rotation has changed
		if (event.fieldName === 'rotation_changed')
        {
			var axisRotation = new x3dom.fields.SFMatrix4f;;
			// Decide which rotation axis is active
			switch (string){
				case "x":
					axisRotation = x3dom.fields.SFMatrix4f.rotationZ(-1.57);
					break;
				case "y":
					axisRotation = new x3dom.fields.SFMatrix4f;
					break;
				case "z":
					axisRotation = x3dom.fields.SFMatrix4f.rotationX(1.57);
					break;
			}

			var offsetM = axisRotation.mult(event.value.toMatrix()).mult(axisRotation.inverse());

			gizmo_currRMatrix = gizmo_oldRMatrix.mult(offsetM);

			
			// Apply current transforms to active MyObject and Gizmo
			Gizmo.applyLiveTransformations();

		}

		// If this element is not active
		if (event.fieldName === 'isActive' && event.value === false)
        {
			// Save current rotation to old rotation if rotation elem is no longer active
			gizmo_oldRMatrix = gizmo_currRMatrix;
		}
		
	}




	/**
	 * Apply transforms to active MyObject and Gizmo and DragInput.dragInputs
	 */
	static applyLiveTransformations(passive = false){

		// Create transform for MyObject and Gizmo
		// .mult - x3dom function - "post multiply" - A.mult(B) equals A*B - this * that - this post multiplied by that		
		var T = gizmo_currTMatrix;
		var TR = T.mult(gizmo_currRMatrix); // Was used for gizmo transform without scale
		var TRS = TR.mult(gizmo_currSMatrix);

		// var TS = gizmo_currTMatrix.mult(gizmo_currSMatrix); // Gizmo transform without rotation

		// Apply
		gizmo_attachedMyObject.transform.setFieldValue("matrix", TRS.transpose());
		// gizmo_matrixTransform.setFieldValue("matrix", TRS.transpose());
		gizmo_matrixTransform.setFieldValue("matrix", TR.transpose());
		// gizmo_matrixTransform.setFieldValue("matrix", T.transpose());

		// Update DragInput.dragInputs according to current transforms
		if (!passive){
			DragInput.updateDragInputs();
		}
	}


	/**
	 * Initialize old and current gizmo transforms
	 */
	static reset(){
		gizmo_oldSMatrix = new x3dom.fields.SFMatrix4f();
		gizmo_oldRMatrix = new x3dom.fields.SFMatrix4f();
		gizmo_oldTMatrix = new x3dom.fields.SFMatrix4f();

		gizmo_currSMatrix = new x3dom.fields.SFMatrix4f();
		gizmo_currRMatrix = new x3dom.fields.SFMatrix4f();
		gizmo_currTMatrix = new x3dom.fields.SFMatrix4f();
	}


	
	/**
	 * Attach MyObject object to gizmo, apply the object's transforms to gizmo
	 * @param {*} myObject
	 */
	static attachModel(myObject){
		// Attached object
		gizmo_attachedMyObject = myObject;

		switch (myObject.myObjectType){
			// If it's Locator
			case "Locator":
				// Enable only translation
				Gizmo.enableJustTranslation();

				// Initialize simulator of Locator's transform
				gizmo_locatorTransformSimulator.setFieldValue("matrix", new x3dom.fields.SFMatrix4f());
				
				break;
			case "Model":
				// Enable translation, rotation, scale
				Gizmo.enableAllTransformations();

				// Simulate Locator transform on gizmo
				gizmo_locatorTransformSimulator.setFieldValue("matrix", myObject.parent.transform.getFieldValue("matrix"));
								
				break;
			default: 
				// Discard attached myObject, if any
				gizmo_attachedMyObject = undefined;
				return;
				break;
		}

		// Apply Model transforms to Gizmo
		Gizmo.applyModelTransformationsToGizmo();

	}

	/**
	 * Enable only Gizmo element for changing translation
	 */
	static enableJustTranslation(){
		// Make Gizmo elements for rotation, translation, scale visible
		Gizmo.enableAllTransformations();

		// Select gizmo elements that control rotation and scale
		var dList = gizmo_elem.querySelectorAll("#gizmo__group_rx, #gizmo__group_sx, #gizmo__group_ry, #gizmo__group_sy, #gizmo__group_rz, #gizmo__group_sz");
		// And disable them
		X3domLib.makeListInvisible(dList);		
	}

	/**
	 * Make Gizmo elements for rotation, translation, scale visible
	 */
	static enableAllTransformations(){
		// Select Gizmo elements for changing rotation, translation, scale
		var eList = gizmo_elem.querySelectorAll("#gizmo__group_rx, #gizmo__group_tx, #gizmo__group_sx, #gizmo__group_ry, #gizmo__group_ty, #gizmo__group_sy, #gizmo__group_rz, #gizmo__group_tz, #gizmo__group_sz");
		// Make them visible
		X3domLib.makeListVisible(eList);
	}

	/**
	 * Apply Model transforms to Gizmo
	 */
	static applyModelTransformationsToGizmo(){

		// Get attached MyObject's transform
		var transforms = X3domLib.getTransformsFromMatrixTransform(gizmo_attachedMyObject.transform);

		// Initialize transforms
		var tM = new x3dom.fields.SFMatrix4f();
		var rM = new x3dom.fields.SFMatrix4f();
		var sM = new x3dom.fields.SFMatrix4f();

		// Set them according to MyObject's transforms
		// .setTranslate - x3dom function - applies translation to existing matrix
		tM.setTranslate(transforms.t);		
		rM.setRotate(transforms.r);		
		sM.setScale(transforms.s);

		// Set old gizmo matrices
		gizmo_oldTMatrix = tM;
		gizmo_oldRMatrix = rM;
		gizmo_oldSMatrix = sM;

		// Set current gizmo matrices
		gizmo_currTMatrix = tM;
		gizmo_currRMatrix = rM;
		gizmo_currSMatrix = sM;
		
		
		Gizmo.applyLiveTransformations();
		

	}

	/**
	 * Make Gizmo visible
	 */
	static makeVisible(){
		X3domLib.makeNodeVisible(gizmo_elem);
	}

	/**
	 * Make Gizmo invisible
	 */
	static makeInvisible(){
		X3domLib.makeNodeInvisible(gizmo_elem);
	}

	/**
	 * Attach active Model or Locator MyObject to Gizmo and make both Gizmo and MyObject visible
	 */
	static refresh(){

		var object;

		// If an active Scene exists
		if (scene_active){
			// Get active MyObject from the main outliner
			object = outliner_normalOutliner.activeMyObject;
		}

		// If the object exists
		if (object){
			// If it's of Model or Locator type			
			if (["Model", "Locator"].includes(object.myObjectType)){
				// Attach it to gizmo
				Gizmo.attachModel(object);
				// Make gizmo visible
				Gizmo.makeVisible();
				return;
			}
		}
		// Make gizmo invisible
		Gizmo.makeInvisible();
	}




	static setTranslationX(value){
		var t = X3domLib.getTransforms(gizmo_currTMatrix).t;
		t.x = value;
		Gizmo.setGizmoTranslation(t);
	}

	static setTranslationY(value){
		var t = X3domLib.getTransforms(gizmo_currTMatrix).t;
		t.y = value;
		Gizmo.setGizmoTranslation(t);
	}

	static setTranslationZ(value){
		var t = X3domLib.getTransforms(gizmo_currTMatrix).t;
		t.z = value;
		Gizmo.setGizmoTranslation(t);
	}

	static setScale(value){
		var scaleVector = new x3dom.fields.SFVec3f(value, value, value);
		Gizmo.setGizmoScale(scaleVector);
	}

	

}
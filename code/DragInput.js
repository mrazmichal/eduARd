/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


/**
 * Modified input element for numbers, supports mouse dragging and manual number input.
 * Is updated when Gizmo transform changes or when user interacts with DragInput.
 * 
 * The DragInput has two modes - when being dragged by mouse (dragMode) and when manually inputting number (selectMode)
 */
var DragInput = class DragInput{

	// Input template:
	//<input id="input1" type="text"></input>

	static DRAG_IGNORE_RANGE = 5; // in pixels
	static DRAGINPUT_DECIMAL_PLACES = 2;

	static windowListenersInitialized = false;

	static mouseIsDown = false;
	// mouse horizontal position when user started dragging
	static x0;
	// original dragInput value
	static value0;

	static mappingPurposeToDragInput = {};
	static activeDragInput;

	static valueChangedEvent = new CustomEvent("valueChanged");

	elem;
	purpose;

	constructor(input, purpose){
		
		this.elem = input;
		this.purpose = purpose;

		DragInput.mappingPurposeToDragInput[this.purpose] = this;
		
		if (!this.windowListenersInitialized){
			DragInput.onloadInit();
			this.windowListenersInitialized = true;
		}

		var dragInput = this;
		this.elem.addEventListener("valueChanged", () => dragInput.valueChangedEventHandler(), false);

		this.modifyInputElem();
	}

	/**
	 * Add global event listeners
	 */
	static onloadInit(){
		window.addEventListener('mouseup', event => DragInput.finishDrag_static(event));
		window.addEventListener('mousemove', event => DragInput.drag_static(event));
	}

	getValue(){
		return parseFloat(this.elem.value).toFixed(DragInput.DRAGINPUT_DECIMAL_PLACES);
	}

	setValue(value){
		this.elem.value = parseFloat(value).toFixed(DragInput.DRAGINPUT_DECIMAL_PLACES);
		if (this.elem.value === "" || this.elem.value === undefined || this.elem.value === "NaN"){
			this.setValue(0);
		}		
	}

	/**
	 * Change Gizmo transforms when DragInput value changes
	 */
	valueChangedEventHandler() {

		var value = 1* this.elem.value;

		switch(this.purpose){
			case "translate x":
				Gizmo.setTranslationX(value)
				break;
			case "translate y":
				Gizmo.setTranslationY(value)
				break;
			case "translate z":
				Gizmo.setTranslationZ(value)
				break;
			case "scale":
				Gizmo.setScale(value)
				break;
			case "rotate x":
			case "rotate y":
			case "rotate z":
				var draxInputRXValue = 1* DragInput.mappingPurposeToDragInput["rotate x"].elem.value;
				var rX = degreesToRadians(draxInputRXValue);
				var draxInputRYValue = 1* DragInput.mappingPurposeToDragInput["rotate y"].elem.value;
				var rY = degreesToRadians(draxInputRYValue);
				var draxInputRZValue = 1* DragInput.mappingPurposeToDragInput["rotate z"].elem.value;
				var rZ = degreesToRadians(draxInputRZValue);
				
				var rVector = new x3dom.fields.SFVec3f(rX, rY, rZ);
				Gizmo.setGizmoRotation(rVector);

				break;
			default:
				var er = new Error("String in DragInput valueChangedEventHandler not recognized");
				message(er);
		}
		
	}


	/**
	 * Initializace dragInput attributes
	 */
	modifyInputElem(){
		var elem = this.elem;
		var dragInput = this

		elem.className = "dragInput dragMode";
		elem.step = 0.1;
		
		elem.onmousedown = event => dragInput.initiateDrag(event);
		elem.ondragend = event => dragInput.finishDrag(event);

		elem.onkeydown = event => dragInput.pressedKey(event);
	
		elem.onfocus = event => dragInput.gotFocus(event);
		elem.onblur = event => dragInput.lostFocus(event);
	
		elem.title = "Hold shift while dragging for smoother movement";
	
	}

	

	/**
	 * Start dragging on mouse down event
	 * @param {*} event 
	 */
	initiateDrag(event){

		// Active input
		DragInput.activeDragInput = this;

		DragInput.mouseIsDown = true;	
		// Horizontal mouse X position
		DragInput.x0 = 1* event.pageX;
		// Remember previous input value
		DragInput.value0 = 1* this.elem.value;	
	}

	/**
	 * Drag function launcher
	 */
	static drag_static(event){
		if (!DragInput.mouseIsDown){
			return;
		}

		DragInput.activeDragInput.drag(event);
	}

	/**
	 * Process mouse drag event
	 */
	drag(event){
		// Assert the mouse was pressed on some DragInput
		if (!DragInput.mouseIsDown){
			return;
		}

		// Assert the input is in dragging mode
		if (!this.elem.classList.contains("dragMode")){
			return;
		}
					
		// New mouse X position
		var xNew = event.pageX;
		var diff = xNew - DragInput.x0;			
		// Ignore small mouse movement
		if (Math.abs(diff) > DragInput.DRAG_IGNORE_RANGE){
			// Start measuring distance after the ignore range
			diff -= DragInput.DRAG_IGNORE_RANGE * Math.sign(diff);
		} else {
			// Don't measure any distance
			diff = 0;
		}

		// Move faster when the shift key is pressed
		var step = this.elem.step;
		step = event.shiftKey ? step / 10 : step;
		var num = DragInput.value0 + diff*step;
		this.elem.value = num.toFixed(DragInput.DRAGINPUT_DECIMAL_PLACES);

		this.elem.dispatchEvent(DragInput.valueChangedEvent);
	
	}

	/**
	 * FinishDrag function launcher
	 */
	static finishDrag_static(event){
		if (!DragInput.mouseIsDown){
			return;
		}
		
		DragInput.activeDragInput.finishDrag(event);
	}

	/**
	 * Process mouse drag finish event
	 */
	finishDrag(event){	
		if (DragInput.mouseIsDown){
			DragInput.mouseIsDown = false;

			// Current mouse X position
			var xNew = event.pageX;		

			// If mouse movement during dragging was none or small
			// Switch this DragInput into selectMode (number input by typing)
			if (Math.abs(xNew - DragInput.x0) <= DragInput.DRAG_IGNORE_RANGE){
				if (this.elem.classList.contains("dragMode")){
					this.elem.select(); // Selects text in the element
				}
				this.elem.classList.remove("dragMode");	
				this.elem.classList.add("selectMode");				
			}
		
		}
		
	}

	/**
	 * Process DragInput element lost focus event
	 */
	lostFocus(event){
		this.elem.classList.remove("selectMode");	
		this.elem.classList.add("dragMode");

		this.finishInput();
	}
	
	gotFocus(event){
		DragInput.activeDragInput = this;
	}
	
	/**
	 * Process key press event
	 */
	pressedKey(event){
		if (event.key === "Enter"){
			this.finishInput();
			// Probably also calls finishInput...
			this.elem.blur();
		}
	}

	finishInput(){
		this.setValue(this.elem.value)
		this.elem.dispatchEvent(DragInput.valueChangedEvent);
	}

	/**
	 * Update DragInput.dragInputs with current Gizmo transforms
	 */
	static updateDragInputs(){
		var t = X3domLib.getTransforms(gizmo_currTMatrix).t;
		var s = X3domLib.getTransforms(gizmo_currSMatrix).s;
		var r = X3domLib.getEulerXYZFromMatrix(gizmo_currRMatrix)


		var dragInput;
		dragInput = DragInput.mappingPurposeToDragInput["translate x"];
		dragInput?.setValue(t.x);
		dragInput = DragInput.mappingPurposeToDragInput["translate y"];
		dragInput?.setValue(t.y);
		dragInput = DragInput.mappingPurposeToDragInput["translate z"];
		dragInput?.setValue(t.z);


		dragInput = DragInput.mappingPurposeToDragInput["scale"];
		dragInput?.setValue(s.x);


		var degrees;
		dragInput = DragInput.mappingPurposeToDragInput["rotate x"];
		degrees = radiansToDegrees(r.x);
		dragInput?.setValue(degrees);

		dragInput = DragInput.mappingPurposeToDragInput["rotate y"];
		degrees = radiansToDegrees(r.y);
		dragInput?.setValue(degrees);

		dragInput = DragInput.mappingPurposeToDragInput["rotate z"];
		degrees = radiansToDegrees(r.z);
		dragInput?.setValue(degrees);

	}

	/**
	 * Clear the mapping purpose string -> DragInput
	 */
	static clearMapping(){
		DragInput.mappingPurposeToDragInput = {};
	}


}

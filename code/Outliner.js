/**
 * Original author	Michal Mráz
 * Created:   	  	29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 * 
 * This file contains functions connected to outliner and properties.
 **/


// Button icons (used in OutlinerItem section)
var collapseButtonClassString = "collapseButton far fa-minus-square";
var expandButtonClassString = "expandButton far fa-plus-square";
var emptyButtonClassString = "emptyButton far fa-square";

// Needed for keyboard arrows navigation in outliner
visibleItemsList = [];

// The main outliner and outliners for Trigger and Action overlays
var outliner_normalOutliner;
var outliner_triggerOutliner; // is in Trigger overlay
var outliner_actionOutliner; // is in Action overlay

// Currently active outliner - we interact only with one at a time
var outliner_active;

// The active myObject
// outliner_normalOutliner.activeMyObject

/**
 * Holds information about current state of an outliner
 */
class Outliner {

/**
 * Create new Outliner
 * @param {*} elem Outliner element
 */
    constructor(elem){
        //outliner element
        this.elem = elem;
        //mapping from outliner items to MyObjects
        this.mappingItemToObject = new Map();
        //from MyObjects to items
        this.mappingObjectToItem = new Map();
        //MyObjects get assigned boolean, which says if their item is collapsed
        this.mappingObjectToCollapsed = new Map(); // by deleting this we can clean Collapsed items memory all at once

        //every Outliner has it's currently active MyObject
        // this.activeMyObject
    }


    /**
     * Remove all outliner element children, clear mappings
     */
    static reset(){
        
        // Remove all elements from currently active outliner
        removeElementChildren(outliner_active.elem);

        // Clear mappings
        outliner_active.mappingItemToObject.clear();// = new Map();
        outliner_active.mappingObjectToItem.clear();
        
        // Outliner remembers collapsed MyObjects
        // Mapping object -> collapsed stays, we don't clear it // The mappings could theoretically keep accumulating...
        
    }


    /**
     * Alternative names
     */
    static refresh = this.loadAll
    static update = this.loadAll
    
    /**
     * 
     */
    static loadAll(){

        Outliner.reset();

        // If Scenario exists
        if (scenario){        

            // If the active outliner is triggerOutliner (for Triggers)
            if(outliner_active == outliner_triggerOutliner){
                //hold a list of allowed MyObject types, which can be targets of Trigger MyObject
                trigger_allowedObjectTypes = Trigger.overlay_getAllowedTargetObjectTypes();
            // If the active outliner is actionOutliner (for Actions)
            } else if(outliner_active == outliner_actionOutliner){
                //hold a list of allowed MyObject types, which can be targets of Action MyObject
                action_allowedObjectTypes = Action.overlay_getAllowedTargetObjectTypes();
            }

            // List of items, which should be currently visible - that means not hidden because some ancestor item is collapsed
            visibleItemsList = [];


            // Recursively load all items belonging to a subtree defined by it's root (scene_active)
            Outliner.loadItems(outliner_active.elem, scenario, 0, false);    
            // When Scene was the root of the displayed tree:
            // Outliner.loadItems(outliner_active.elem, scene_active, 0, false);    


            // Highlight selected item
            var object = outliner_active.activeMyObject;
            if (object){
                // Get item corresponding to the MyObject
                var item = outliner_active.mappingObjectToItem.get(object);
                if (item){
                    // Mark item as "selected"
                    Outliner.highlightItem(item);
                }                
            }
            

        }

        Outliner.refreshProperties();
        
    }

    /**
     * Update outliner properties view
     */
    static refreshProperties(){
        // Get item properties element
        var propertiesElem = document.getElementById("outlinerItemProperties");
        
        // Remove all properties's children ("reset it")
        removeElementChildren(propertiesElem);


        // Get active MyObject of the normal outliner
        var object = outliner_normalOutliner.activeMyObject;
        // If the active outliner is normalOutliner
        if (outliner_active == outliner_normalOutliner){
            
            if (object){
                Outliner.displayMyObjectProperties(object);
            } else {
                Outliner.displayDefaultProperties();
            }            

        }
    }



    /**
     * Creates item representation of given object, does recursively the same for it's children
     * @param {*} parentItem outliner element, same for all items
     * @param {*} object Represented object
     * @param {*} depth How deep the recursion is in the subtree
     * @param {*} hidden Is current object hidden ?
     */
    static loadItems(parentItem, object, depth, hidden){
        
        // Create item
        var item = Outliner.createTreeItem(object);

        if (hidden){
            item.classList.add("hidden");
        } else {
            visibleItemsList.push(item);
        }

        // Set CSS for left padding
        var pixelOffset = 12;
        item.style = "padding-left:" + pixelOffset * depth + "px;";
        // Append child item to parent
        parentItem.appendChild(item);


        // If the given MyObject of active outliner is collapsed
        if (outliner_active.mappingObjectToCollapsed.get(object)){
            hidden = true;
        }

        // Get children of MyObject
        var children = object.children;
        if (children && children.length > 0){
            // For each children load it's outliner item
            for (var i = 0; i < children.length; i++){
                Outliner.loadItems(parentItem, children[i], depth + 1, hidden);
            }
        }

        
    }


    static displayDefaultProperties(){
        // Get properties elem
        var propertiesElem = document.getElementById("outlinerItemProperties");
        var elem = htmlToElement(
            `<button class="btn btn-primary" onclick="turnOnOverlay('chooseScenarioOverlay');">
            Choose existing Scenario...
            </button>`
        );
        Outliner.insertIntoProperties(elem);
        var elem = htmlToElement(
            `<button class="btn btn-primary" onclick="turnOnOverlay('createScenarioOverlay');">
            Create new Scenario...
            </button>`
        );
        Outliner.insertIntoProperties(elem);
        var elem = htmlToElement(
            `<button class="btn btn-advanced" onclick="turnOnOverlay('scenariosManagementOverlay');">
            Manage Scenarios...
            </button>`
        );
        Outliner.insertIntoProperties(elem);
    }

    /**
     * Updates properties elem "view"
     * @param {MyObject} object
     */
    static displayMyObjectProperties(object){

        if (object == null){
            console.error("The object is null");
            return;
        }

        // Get properties elem
        var propertiesElem = document.getElementById("outlinerItemProperties");

        
        // Properties of MyObject =================================

        // Create element showing MyObject type
        var elem = htmlToElement('<span>Object type: '+ object.myObjectType + '</span>');
        Outliner.insertIntoProperties(elem);
        
        // Create input for changing MyObject name
        var elem = htmlToElement('<input type="text" title="Change the object\'s displayed name"></input>');
        // After pressing enter call blur (unfocus)
        elem.onkeydown = function(event){ 
            if (event.key === "Enter"){
                event.target.blur();			
            }    
        };
        elem.onblur = function(event){
            // When unfocused, set nickname of MyObject
            MyObject.setNameFromTextInput(object, event.target.value);
        }
        // Use nickname if it exists, else use name
        var displayedName = object._getDisplayName();
        elem.value = displayedName;
        // Label in front of renaming input
        var label = htmlToElement('<label>Nickname: </label>');
        label.append(elem);
        Outliner.insertIntoProperties(label);

        // Generate elements which act sort of like "properties" of the MyObjects
        switch(object.myObjectType) {
            case "MyObject_Animation":

                var originalName = object.x3dId
                var elem = htmlToElement('<span>Original name: "'+ originalName + '"</span>');
                Outliner.insertIntoProperties(elem);

                // Button for turning on animation
                var elem = htmlToElement(
                    `<button class="btn btn-advanced" onclick="MyObject_Animation.enableMyObject_Animation(outliner_normalOutliner.activeMyObject)">
                    Play animation
                    </button>`
                );
                Outliner.insertIntoProperties(elem);
                // Button for turning off animation
                var elem = htmlToElement(
                    `<button class="btn btn-advanced" onclick="MyObject_Animation.disableMyObject_Animation(outliner_normalOutliner.activeMyObject)">
                    Stop animation
                    </button>`
                );
                Outliner.insertIntoProperties(elem);
                break;
            case "Anchor":
            case "Marker":
                
                var elem = htmlToElement('<span>Marker type: "'+ object.markerType + '"</span>');
                Outliner.insertIntoProperties(elem);

                var elem = htmlToElement('<span>Image width (meters): "'+ object.markerWidth + '"</span>');
                Outliner.insertIntoProperties(elem);

                var elem = htmlToElement('<span>Image filename: "'+ object.markerImageFilename + '"</span>');
                Outliner.insertIntoProperties(elem);

                var elem = htmlToElement(
                    `<button class="btn btn-advanced" onclick="turnOnOverlay('chooseMarkerOverlay');">
                    Edit Marker...
                    </button>`);
                Outliner.insertIntoProperties(elem);
                break;

                
            case "Locator":
                // Get transforms from object
                var transforms = X3domLib.getTransformsFromMatrixTransform(object.transform);
                // Translation
                var t = transforms.t;

                
                DragInput.clearMapping();

                Outliner.createDragInput('Translation X (meters): ', 'translate x', t.x);
                Outliner.createDragInput('Translation Y (meters): ', 'translate y', t.y);
                Outliner.createDragInput('Translation Z (meters): ', 'translate z', t.z);

                break;
            case "Model":
                var elem = htmlToElement('<span>Model filename: "'+ object.filename + '"</span>');
                Outliner.insertIntoProperties(elem);

                // Get transforms from object
                var transforms = X3domLib.getTransformsFromMatrixTransform(object.transform);
                // Translation
                var t = transforms.t;
                // Scale
                var s = transforms.s;
                // Rotation  (get by conversion from quaternions to Euler XYZ)
                var r = X3domLib.getEulerXyzFromQuaternion(transforms.r);


                DragInput.clearMapping();
                // DragInputs
                Outliner.createDragInput('Translation X (meters): ', 'translate x', t.x);
                Outliner.createDragInput('Translation Y (meters): ', 'translate y', t.y);
                Outliner.createDragInput('Translation Z (meters): ', 'translate z', t.z);
                Outliner.createDragInput('Scale (factor): ', 'scale', s.x);
                Outliner.createDragInput('Rotation X (degrees): ', 'rotate x', r.x, 0.5);
                Outliner.createDragInput('Rotation Y (degrees): ', 'rotate y', r.y, 0.5);
                Outliner.createDragInput('Rotation Z (degrees): ', 'rotate z', r.z, 0.5);

                break;
            case "Scenario":
            
                break;
            case "Scene":
            
                break;
            case "Event":

                break;
            case "ModelPart":
                var regex = new RegExp('^(modelPart_)')
                var originalName = object.x3dId.replace(regex, ""); // remove modelPart prefix
                var elem = htmlToElement('<span>Original name: "'+ originalName + '"</span>');
                Outliner.insertIntoProperties(elem);

                break;
            case "Annotation":
                var elem = htmlToElement(
                    `<button class="btn btn-advanced" onclick="turnOnOverlay('annotationCreationOverlay'); Annotation.startEditing();">
                    Edit Annotation...
                    </button>`);
                Outliner.insertIntoProperties(elem);
                break;
            case "Action":
                // Because sometimes target object is not found, TODO remove later
                refreshAllTargets();

                var elem = htmlToElement('<span>Action type: "'+ object.actionType + '"</span>');
                Outliner.insertIntoProperties(elem);

                for (var i = 0; i < object.parameters.length; i+=2){
                    var elem = htmlToElement('<span>' + object.parameters[i] + ': "'+ object.parameters[i+1] + '"</span>');
                    Outliner.insertIntoProperties(elem);
                }

                var elem = htmlToElement('<span>Target object: "'+ object.target._getDisplayName() + '"</span>');
                Outliner.insertIntoProperties(elem);

                var elem = htmlToElement(
                    `<button class="btn btn-advanced" onclick="turnOnOverlay('actionCreationOverlay'); Action.startEditing();">
                    Edit Action...
                    </button>`);
                Outliner.insertIntoProperties(elem);
                break;
            case "Trigger":
                
                // Added here because sometimes target object is not found, TODO remove later
                refreshAllTargets();

                var elem = htmlToElement('<span>Trigger type: "'+ object.triggerType + '"</span>');
                Outliner.insertIntoProperties(elem);

                for (var i = 0; i < object.parameters.length; i+=2){
                    var elem = htmlToElement('<span style="margin-left:8px">' + " • " + object.parameters[i] + ': "'+ object.parameters[i+1] + '"</span>');
                    Outliner.insertIntoProperties(elem);
                }

                var elem = htmlToElement('<span>Target object: "'+ object.target._getDisplayName() + '"</span>');
                Outliner.insertIntoProperties(elem);

                var elem = htmlToElement(
                    `<button class="btn btn-advanced" onclick="turnOnOverlay('triggerCreationOverlay'); Trigger.startEditing();">
                    Edit Trigger...
                    </button>`);
                Outliner.insertIntoProperties(elem);
                break;
            case "Button":

                break;
            case "GPS":
                var elem = htmlToElement('<span>Latitude: '+ object.gpsCoordinates.lat + '</span>');
                Outliner.insertIntoProperties(elem);
                var elem = htmlToElement('<span>Longitude: '+ object.gpsCoordinates.lng + '</span>');
                Outliner.insertIntoProperties(elem);
                elem = htmlToElement(
                    `<button class="btn btn-advanced" onclick="GPS.edit();">
                    Edit GPS...
                    </button>`);
                Outliner.insertIntoProperties(elem);
                break;
            case "Picture":
            case "Video":

                var b = htmlToElement('<span>Filename: "'+ object.filename + '"</span>');
                Outliner.insertIntoProperties(b);
                break;

            default:
                console.log("This myObject type is not yet supported (Outliner -> properties section)");
        }



        // If object is Locator or Model
        if (["Locator", "Model"].includes(object.myObjectType)){
            // Add button for resetting MyObject's transformations and Gizmo's position
            var elem = htmlToElement(
                `<button class="btn btn-advanced" onclick="Gizmo.reset(); Gizmo.applyLiveTransformations(); Outliner.refresh()">
                Reset transformations
                </button>`);
            Outliner.insertIntoProperties(elem);
        }

        // Insert visual separator (thematic break)
        var hr = htmlToElement("<hr></hr>");
        Outliner.insertIntoProperties(hr);



        // Manipulation with MyObjects tree ==================================================


        // For MyObjects of each type
        switch (object.myObjectType){
            case "Locator":

                // Create child Annotation, turn on overlay (annotationCreationOverlay)
                var elem = htmlToElement(
                    `<button class="btn btn-primary" onclick="turnOnOverlay('annotationCreationOverlay');">
                    Create child Annotation...
                    </button>`);
                Outliner.insertIntoProperties(elem);

                // Create child Button (MyObject)
                var elem = htmlToElement(
                    `<button class="btn btn-primary" onclick="Button.createButton();">
                    Create child Button
                    </button>`);
                Outliner.insertIntoProperties(elem);

                var button = htmlToElement(
                    `<button class="btn btn-primary" onclick="turnOnOverlay('chooseModelOverlay');">
                    Create child Model...
                    </button>`);
                Outliner.insertIntoProperties(button);
                break;
            case "Model":
                // Create Annotation, turn on overlay
                var elem = htmlToElement(
                    `<button class="btn btn-primary" onclick="turnOnOverlay('annotationCreationOverlay');">
                    Create child Annotation...
                    </button>`);
                Outliner.insertIntoProperties(elem);
                
                break;

            case "Scenario":
                // Create Scene
                var elem = htmlToElement(
                    `<button class="btn btn-primary" onclick="Scene.createScene();">
                    Create child Scene
                    </button>`);
                Outliner.insertIntoProperties(elem);

                break;

            case "Scene":
                // Create Anchor, turn on overlay
                var elem = htmlToElement(
                    `<button class="btn btn-primary" onclick="turnOnOverlay('chooseSceneAnchorOverlay');">
                    Create child Anchor...
                    </button>`);
                // Disable button for adding child Anchor if Scene already has an Anchor
                var includesAnchor = false;
                for (var i = 0; i < object.children.length; i++){
                    // Check type of every child
                    var type = object.children[i].myObjectType;
                    // If the type is Marker or GPS (Anchor)
                    if (["Marker", "GPS"].includes(type)){
                        includesAnchor = true;
                        break;
                    }
                }
                // Disable elem if includes Anchor
                if (includesAnchor){
                    elem.disabled = true;
                }
                // Still insert it
                Outliner.insertIntoProperties(elem);

                // Create Event
                var elem = htmlToElement(
                    `<button class="btn btn-primary" onclick="Event.createEvent();">
                    Create child Event
                    </button>`);
                Outliner.insertIntoProperties(elem);
                // Create Picture
                var elem = htmlToElement(
                    `<button class="btn btn-primary" onclick="turnOnOverlay('createPictureOverlay');">
                    Create child Picture...
                    </button>`);
                Outliner.insertIntoProperties(elem);
                // Create Video
                var elem = htmlToElement(
                    `<button class="btn btn-primary" onclick="turnOnOverlay('createVideoOverlay');">
                    Create child Video...
                    </button>`);
                Outliner.insertIntoProperties(elem);
                break;

            case "Event":
                // Create Trigger
                var elem = htmlToElement(
                    `<button class="btn btn-primary" onclick="turnOnOverlay('triggerCreationOverlay');">
                    Create child Trigger...
                    </button>`);
                Outliner.insertIntoProperties(elem);
                // Create Action
                var elem = htmlToElement(
                    `<button class="btn btn-primary" onclick="turnOnOverlay('actionCreationOverlay');">
                    Create child Action...
                    </button>`);
                Outliner.insertIntoProperties(elem);
                break;

            case "ModelPart":
                // Create Annotation
                var elem = htmlToElement(
                    `<button class="btn btn-primary" onclick="turnOnOverlay('annotationCreationOverlay');">
                    Create child Annotation...
                    </button>`);
                Outliner.insertIntoProperties(elem);
                break;

            case "Anchor":
            case "Marker":
            case "GPS":
                // Create Locator
                var elem = htmlToElement(
                    `<button class="btn btn-primary" onclick="Locator.createNewLocator(outliner_normalOutliner.activeMyObject);">
                    Add a new Locator
                    </button>`);
                Outliner.insertIntoProperties(elem);
                break;
        }

        

        // Add spacer
        var hr = htmlToElement("<hr></hr>");
        Outliner.insertIntoProperties(hr);


        // Options affecting current MyObject directly ======================

        // If object is not of one of these types
        if (!(["Scenario", "ModelPart", "MyObject_Animation"].includes(object.myObjectType))){
            // Add remove button
            var elem = htmlToElement(
                `<button class="btn btn-danger" title="Removes the currently selected object and it's descendants" onclick="MyObject.delete(outliner_normalOutliner.activeMyObject);">
                Remove
                </button>`);
            Outliner.insertIntoProperties(elem);
        }

        if (object.myObjectType === "Scenario"){
            // Save button
            var elem = htmlToElement(
                `<button class="btn btn-success" title="Save current Scenario to server" onclick="Scenario.save()">
                Save to server
                </button>`);
            Outliner.insertIntoProperties(elem);

            // Delete button
            var elem = htmlToElement(
                `<button class="btn btn-danger" title="Delete current Scenario from server" onclick="turnOnOverlay('deletingScenarioOverlay');">
                Delete on server
                </button>`
            );
            Outliner.insertIntoProperties(elem);

            var elem = htmlToElement(
                `<button class="btn btn-advanced" onclick="turnOnOverlay('assetsManagementOverlay');">
                Manage Scenario assets...
                </button>`
            );
            Outliner.insertIntoProperties(elem);

            // Close button
            var elem = htmlToElement(
                `<button class="btn btn-secondary" title="Close current Scenario" onclick="turnOnOverlay('closingScenarioOverlay');">
                Close
                </button>`
            );
            Outliner.insertIntoProperties(elem);
        }


        
    }


    /**
     * Put given elem into the properties section (and wrap the elem in a div)
     * @param {HMTL element} elem 
     */
    static insertIntoProperties(elem){
        // Get properties elem
        var propertiesElem = document.getElementById("outlinerItemProperties");

        // Create div
        var divFiller = htmlToElement('<div></div>');
        // Put elem into div, put div into properties elem
        propertiesElem.appendChild(divFiller).appendChild(elem);
    }

    
    /**
     * Set given Outliner as active
     * @param {Outliner} outliner 
     */
    static setActive(outliner){
        outliner_active = outliner;
    }


    /**
     * Process keydown event
     * @param {*} key Key from event
     */
    static processKeydown(key){

        // Get active MyObject of active outliner
        var object = outliner_active.activeMyObject;
        // Get corresponding item
        var item = outliner_active.mappingObjectToItem.get(object);
                
        // Navigation in outliner using arrow keys
        switch (key) {
            case "ArrowDown":
                goDown();
                break;

            case "ArrowUp":
                goUp();
                break;
                
            case "ArrowRight":
                expand();
                break;

            case "ArrowLeft":
                collapse();
                break;   
        }

        /**
         * Select item visible below current item
         */
        function goDown(){
            
            var list = visibleItemsList;

            var index = list.indexOf(item);
            if (index < list.length -1){
                Outliner.clickedTreeElem(list[index +1]);
            }
            
        }

        /**
         * Select item visible above current item
         */
        function goUp(){
            
            var list = visibleItemsList;

            var index = list.indexOf(item);
            if (index > 0){
                Outliner.clickedTreeElem(list[index -1]);
            }
            
        }

        // Expand current item's tree
        function expand(){
            Outliner.expandTreeElem(item);
        }

        // Collapse current item's tree
        function collapse(){
            Outliner.collapseTreeElem(item);
        }


    }




    //OutlinerItem section ===================================

    /**
     * Create outliner item from given MyObject
     * @param {MyObject} object the object the new Tree item / outliner row represents
     */
    static createTreeItem(object){
        
        // If nickname exists, use it, else use name
        var displayedName = object._getDisplayName();

        // Create div
        var treeElem = document.createElement("div");
        // Set class treeElem
        treeElem.setAttribute("class", "treeElem"); 
        


        // If triggerOutliner is active
        if (outliner_active == outliner_triggerOutliner && !trigger_allowedObjectTypes.includes(object.myObjectType)){
            // Grey out items, which are not allowed as Trigger targets
            treeElem.classList.add("forbidden");
        } 
        // If actionOutliner is active
        else if (outliner_active == outliner_actionOutliner && !action_allowedObjectTypes.includes(object.myObjectType)){
            // Grey out items, which are not allowed as Action targets
            treeElem.classList.add("forbidden");
        }


        // Create item text elem
        var textElem = htmlToElement("<span class='itemText'>" + displayedName + "</span>"); // treeElem.textContent = displayedName;
        treeElem.appendChild(textElem);
        // Listen for click
        treeElem.setAttribute("onclick", "Outliner.clickedTreeElem(this, event)");
        // Listen for doubleclick
        treeElem.setAttribute("ondblclick", "Outliner.doubleClickedTreeElem(this, event)");


        // Map item to object
        outliner_active.mappingItemToObject.set(treeElem, object);
        // Map object to item
        outliner_active.mappingObjectToItem.set(object, treeElem);

        
        // Add icon to object according to object's MyObject type
        addMyObjectIcon(treeElem, object);
        // Add expansion button
        addExpansionButton(treeElem, object);

        /**
         * Add Font Awesome icon
         */
        function addMyObjectIcon(treeElem, object){
            // Create icon string
            var icon;

            // Set icon based on object's MyObject type
            switch(object.myObjectType){
                case "Scenario":
                    icon = '<i class="fas fa-layer-group"></i>';
                    break;    
                case "Scene":
                    icon = '<i class="fas fa-binoculars"></i>';
                    // icon = '<i class="fas fa-layer-group"></i>';
                    // icon = '<i class="fas fa-project-diagram"</i>';
                    break;
                case "Marker":
                case "GPS":
                case "Anchor":
                    icon = '<i class="fas fa-map-marker-alt"></i>';
                    break;
                case "Locator":
                    icon = '<i class="far fa-dot-circle"></i>';
                    // icon = '<i class="fas fa-dot-circle"></i>';
                    
                    break;
                case "Model":
                    icon = '<i class="fas fa-horse"></i>';
                    // icon = '<i class="fas fa-motorcycle"></i>';
                    // icon = '<i class="fas fa-dragon"></i>';
                    // icon = '<i class="fas fa-hippo"></i>';
                    break;
                case "ModelPart":
                    icon = '<i class="fas fa-project-diagram"></i>';
                    break;
                case "MyObject_Animation":
                    icon = '<i class="fas fa-play"></i>';
                    // icon = '<i class="fas fa-play-circle"></i>';
                    break;
                case "Annotation":
                    // icon = '<i class="far fa-sticky-note"></i>';
                    icon = '<i class="fas fa-sticky-note"></i>';
                    break;
                case "Event":
                    icon = '<i class="far fa-calendar-alt"></i>';
                    break;
                case "Trigger":
                    // icon = '<i class="fas fa-bomb"></i>';
                    icon = '<i class="fas fa-question"></i>';
                    break;
                case "Action":
                    // icon = '<i class="fas fa-magic"></i>';
                    // icon = '<i class="fas fa-fire"></i>';
                    icon = '<i class="fas fa-exclamation" style="padding-left:2px"></i>';
                    break;
                case "Button":
                    // icon = '<i class="fas fa-toggle-off"></i>';
                    icon = '<i class="fas fa-toggle-on"></i>';
                    break;
                case "Video":
                    icon = '<i class="fas fa-film"></i>';
                    break;
                case "Picture":
                    icon = '<i class="fas fa-image"></i>';
                    // icon = '<i class="far fa-image"></i>';
                    break;    
                default:
                    return;
            }        
    
    
            // Convert icon to html element
            var elem = htmlToElement(icon);
            elem.classList.add("itemIcon");
    
            // Create icon wrapper
            var elem2 = htmlToElement("<span class='iconWrapper'></span>");    
            // Append icon elem
            elem2.appendChild(elem);
            
            // Append to item
            treeElem.insertAdjacentElement('afterbegin', elem2);
        }


        /**
         * Add button for item expansion
         * @param {outliner item} treeElem 
         * @param {MyObject} object 
         */
        function addExpansionButton(treeElem, object){
            
            // Add expansion button
            var elem = htmlToElement('<i onclick="Outliner.clickedExpansionButton(this, event);"></i>');

            // If object has some children
            if (object.children.length > 0){
                // If object is collapsed
                if (outliner_active.mappingObjectToCollapsed.get(object)){
                    
                    // Set classes for expansion button (icon from fontAwesome)
                    elem.className = expandButtonClassString;
                } else {                

                    // Set classes for collapse button (icon from fontAwesome)
                    elem.className = collapseButtonClassString;

                }
            } else {

                // Set classes for empty (nor expansion nor collapse) button (icon from fontAwesome)
                elem.className = emptyButtonClassString;                
            }

            // Prepend expansion button in front of outliner item
            treeElem.prepend(elem);
        }
    
    

        // Return outliner item
        return treeElem;
    }



    /**
     * Process expansion button click
     * @param {html button} button Expansion button
     * @param {*} event 
     */
    static clickedExpansionButton(button, event){

        // Don't propagate the event
        if (event){
            event.stopPropagation();
        }

        // Get item to which the click belonged
        var treeElem = button.parentElement;


        // If clicked button is of class collapseButton
        if (button.classList.contains("collapseButton")){

            Outliner.collapseTreeElem(treeElem); 
        } else if (button.classList.contains("expandButton")){
            Outliner.expandTreeElem(treeElem); 
        }

    }
    
    
    


    /**
     * Process item click
     * @param {html element} elem Outliner item
     * @param {*} event 
     */
    static clickedTreeElem(elem, event){
        
        // Get MyObject by outliner item
        var object = outliner_active.mappingItemToObject.get(elem);

        // Set the object as active object of the active outliner
        outliner_active.activeMyObject = object;


        if (object.myObjectType == "Scenario" && outliner_active == outliner_normalOutliner){
            X3domLib.makeEverythingInvisible()
        } else {
            X3domLib.makeEverythingVisible()
        }


        if (object.myObjectType == "Scene"){
            Scene.gotFocused(object);
        }

        if (!["Scenario", "Scene"].includes(object.myObjectType)){
            let scene = findAncestorScene(object);
            Scene.gotFocused(scene);
        }

        function findAncestorScene(object){
            if (!object){
                return
            }

            if (object.myObjectType == "Scene"){
                return object;
            } else {
                return findAncestorScene(object.parent)
            }
            
        }
                

        Outliner.removeHighlightsFromAllItems();
        
        // Highlight the chosen item
        Outliner.highlightItem(elem);
        // Highlight the 3D representation of selected MyObject (if it has any)
        X3domLib.highlightSelectedObjectX3d();


        Outliner.refreshProperties()


        Gizmo.refresh();

        
        
    }

    

    /**
     * Process double click on outliner item 
     */
    static doubleClickedTreeElem(elem, event){

        // If event is not null
        if (event != null){
            event.stopPropagation();
        }

        // Get object from clicked item
        var object = outliner_active.mappingItemToObject.get(elem);

        Outliner.showObject(object);
    }

    /**
     * Focus camera on the object
     * @param {myObject} object 
     */
    static showObject(object){
        // If normalOutliner is active
        if (outliner_active == outliner_normalOutliner){
            // If object is of one of these types
            if (["Model", "ModelPart", "Locator", "Marker", "GPS"].includes(object.myObjectType)){
                var x3domElem;
                switch (object.myObjectType){
                    case "Model":
                        x3domElem = object.modelHolder;
                        break;
                    case "ModelPart":
                        x3domElem = object.modelPartNode;
                        break;
                    case "Locator":
                        x3domElem = object.locatorModel;
                        break;
                    case "Marker":
                        x3domElem = object.group;
                        switch(object.markerType){
                            case "floor":
                                document.getElementById("x3d").runtime.showObject(x3domElem, "posY");
                                return;
                                break;
                            case "wall":
                                document.getElementById("x3d").runtime.showObject(x3domElem, "posZ");
                                return;    
                                break;
                            case "ceiling":
                                document.getElementById("x3d").runtime.showObject(x3domElem, "negY");
                                return;  
                                break;
                        }
                        break;
                    case "GPS":
                        x3domElem = object.group;
                        document.getElementById("x3d").runtime.showObject(x3domElem, "posY");
                        return;
                        break;
                }

                // Look at the object (in x3dom)
                document.getElementById("x3d").runtime.showObject(x3domElem, "posX");
                
            }

        }
    }




    /**
     * Expand item in outliner
     * @param {*} treeElem 
     */
    static expandTreeElem(treeElem){
        // Get object from item
        var object = outliner_active.mappingItemToObject.get(treeElem);
        // Set object as expanded
        outliner_active.mappingObjectToCollapsed.set(object, false);

        Outliner.refresh();
       
    }
    
    /**
     * Collapse item
     * @param {*} treeElem 
     */
    static collapseTreeElem(treeElem){

        // Get object from item
        var object = outliner_active.mappingItemToObject.get(treeElem);
        // Set object to collapsed
        outliner_active.mappingObjectToCollapsed.set(object, true);

        Outliner.refresh();

    }

    /**
     * Add CSS class for rendering item as highlighted
     * @param {*} elem 
     */
    static highlightItem(elem){
        elem.classList.add("selected");
    }

    /**
     * Remove CSS class for highlight from all active outliner's items
     */
    static removeHighlightsFromAllItems(){
        // Get all items in active outliner
        var list = outliner_active.elem.childNodes;
        // Remove CSS class "selected" from all of them
        for (var i = 0; i < list.length; i++){
            list[i].classList.remove("selected");
        }
    }

    /**
     * Simulate click on item corresponding to given object
     * Outliner.update() should be called before this
     * @param {*} myObject 
     */
    static fakeClick(myObject){

        // console.log("fakeClick");

        // Get item from object
        var item = outliner_active.mappingObjectToItem.get(myObject);
        if (item){
            Outliner.clickedTreeElem(item);
        }
        
    }

    /**
     * Create input, DragInput object, connects them and inserts input into Outliner properties
     * @param {*} labelString String saying what to display in front of the DragInput
     * @param {*} purposeString String describing what this DragInput controls - used as DragInput identifier
     * @param {*} initialValue
     * @param {*} step step size
     */
    static createDragInput(labelString, purposeString, initialValue, step=0.1){
		var label = htmlToElement(`<label>${labelString}</label>`);
		var input = htmlToElement('<input type="text"></input>');
		var dragInput = new DragInput(input, purposeString);
        dragInput.setValue(initialValue);               
        dragInput.elem.step = step;
		// Add element
		label.append(input);
		Outliner.insertIntoProperties(label);
		return dragInput;
	}


}



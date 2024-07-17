/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/

/**
 * Display overlay window
 */
function turnOnOverlay(overlayId){
	document.getElementById(overlayId).style.display = "block";

	if (overlayId == "triggerCreationOverlay"){

		Trigger.overlay_initialize();
		outliner_active = outliner_triggerOutliner;				

	} 
	else if (overlayId == "actionCreationOverlay"){

		Action.overlay_initialize();
		outliner_active = outliner_actionOutliner;

	}
	else if (overlayId == "chooseScenarioOverlay"){

		var selectElem = document.getElementById("selectScenario");
		Scenario.scenarioSelectionList_refresh(selectElem);

	} else if (overlayId == "chooseMarkerOverlay"){
		
		// initialize picture assets selection list
		Marker.pictureAssetsSelectionList_refresh();

	} else if (overlayId == "chooseModelOverlay"){
		
		// initialize model assets selection list
		Model.modelAssetsSelectionList_refresh();

	} else if (overlayId == "createPictureOverlay"){
		
		Picture.pictureAssetsSelectionList_refresh();

	} else if (overlayId == "createVideoOverlay"){
		
		Video.videoAssetsSelectionList_refresh();

	} else if (overlayId == "assetsManagementOverlay"){
		
		Scenario.assetList_refresh();

	} else if (overlayId == "scenariosManagementOverlay"){
		
		Scenario.scenarioManagement_refresh();

	}


	Outliner.refresh();

}

/**
 * Hide overlay window
 */
function turnOffOverlay(overlayId){
	document.getElementById(overlayId).style.display = "none";

	if (overlayId == "triggerCreationOverlay"){
		outliner_active = outliner_normalOutliner;
	} else if (overlayId == "actionCreationOverlay"){
		outliner_active = outliner_normalOutliner;
	}

	Outliner.refresh();
}


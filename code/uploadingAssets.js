/**
 * Original author	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 * 
 * Contains functions for uploading assets and showing lists of assets of certain types
 **/


var allowedImageFormats = [".png", ".jpg", ".gif"];
var allowedVideoFormats = [".avi", ".mp4"];

const AssetType = {
    "IMAGE": 1,
    "VIDEO": 2,
    "MODEL": 3,
    "ALL": 4
}

/**
 * Return only those files that have valid image format
 */
function filterOnlyImageFiles(list){
    
    let resArray = [];

    for (let key in list){
        let obj = list[key];
        if (isAllowedImageFormat(obj.name)){
            resArray.push(obj)
        }
    }

    return resArray;
}

/**
 * Check if the file has allowed image format
 */
function isAllowedImageFormat(filename){
    for (var i = 0; i < allowedImageFormats.length; i++){
        if (filename.endsWith(allowedImageFormats[i])){
            return true;
        }
    }
    return false;
}

/**
 * Check if the file has allowed video format
 */
function isAllowedVideoFormat(filename){
    for (var i = 0; i < allowedVideoFormats.length; i++){
        if (filename.endsWith(allowedVideoFormats[i])){
            return true;
        }
    }
    return false;
}

/**
 * Return only X3D model files
 */
function filterOnlyX3dFiles(list){
    let resArray = [];

    for (let key in list){
        let obj = list[key];
        if (obj.name.endsWith(".x3d")){
            resArray.push(obj)
        }
    }

    return resArray;
}

/**
 * Return only files that have allowed video format
 */
function filterOnlyVideoFiles(list){

    let resArray = [];

    console.log(list)

    for (let key in list){
        let obj = list[key];
        if (isAllowedVideoFormat(obj.name)){
            resArray.push(obj)
        }
    }

    return resArray;
}

/**
 * Filter the asset list
 */
function filterAccordingToType(list, type){

    switch(type) {
        case AssetType.IMAGE:
            return filterOnlyImageFiles(list);
            break;
        case AssetType.VIDEO:
            return filterOnlyVideoFiles(list);
            break;
        case AssetType.MODEL:
            return filterOnlyX3dFiles(list);
            break;  
        case AssetType.ALL:
            return list;
            break;  
        default:
            message("unknown filtering type")
    }
        
}

/**
 * Refresh the given select elem according to the given type
 * @param {*} selectElem select elem that shows available assets of allowed type
 * @param {*} type describes a group of allowed file formats
 */
function assetSelect_refresh(selectElem, type){
    
    removeElementChildren(selectElem);

    let list;

    // Get list of Assets from server
    return BackendAPI.getAllScenarioAssets(Scenario.currentScenarioId)
    .then( list => filterAccordingToType(list, type))
    .then( list => createOptions(list) )
    .catch(error => {
        message("Couldn't fetch list of Scenario Assets", error);
        return Promise.reject();
    })

    function createOptions(list){
        
        //display asset name to user, internally use asset id
        for (var i = 0; i < list.length; i++){
            var elem = htmlToElement(`<option value= ${list[i].id} > ${list[i].name} </option>`);
            selectElem.appendChild(elem);
        }

    }

    // // set the selected item in the select element
    // // Could be used in future
    // function chooseOptionWithId(id){
    //     let selectElem = document.getElementById("selectScenario");

    //     for (var i = 0; i < selectElem.options.length; i++){
    //         //console.log(selectElem.options[i].value)
    //         //console.log(id)
    //         if (selectElem.options[i].value == id){
    //             selectElem.selectedIndex = i;
    //         }
    //     }
    // }
    
}

async function uploadAsset(input, select, type){

    let file = input.files[0];

    // Modify asset before upload
    if (type == AssetType.MODEL){
        file = await modifyX3dFile_beforeUpload(file);
    }

    BackendAPI.uploadFileAsNewAsset(file)
    .finally(() => assetSelect_refresh(select, type))
    .catch(error => message("asset list refresh failed", error))

    console.log("refresh ", select, type)

}

function uploadTexture(file){

    BackendAPI.uploadFileAsNewAsset(file)

}

async function getAssetFetchUrl(assetId){
    var assets = await BackendAPI.getAllScenarioAssets(Scenario.currentScenarioId);
    for(var i = 0; i < assets.length; i++){
        var asset = assets[i];
        if (asset.id == assetId){
            return asset.fetchUrl;
        }
    }
    throw Error("Couldn't fetch asset url");    
}


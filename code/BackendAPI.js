/**
 * * Original author:	Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/


/**
 * Contains functions working with the server API
 */
class BackendAPI{

    static signIn(login, password){
        let data =
        {
            "username": login,
            "password": password
        }
    
        return FetchJson(`${apiUrl}/api/Auth/SignIn`, {
            method: 'POST',
            body: JSON.stringify(data)
        }).then(res => Promise.resolve(res))
    }

    /**
     * Token refresh
     */
    static refreshExistingToken(){
        let data = {
            "accessToken": getToken(),
            "refreshToken": getRefreshToken()
        };

        console.log(data);

        return FetchJson(`${apiUrl}/api/Auth/Refresh`, {
            method: 'POST',
            body: JSON.stringify(data)
        }).then(res => Promise.resolve(res))
        .catch(error => {
            message("Couldn't refresh token", error);
            return Promise.reject();
        })
    }

    /**
     * 
     * Scenario
     * 
     */

    static getAllScenarios() {
        return FetchJson(`${apiUrl}/api/Scenarios`, {
            method: 'GET'
        }).then(res => Promise.resolve(res))
        .catch(error => {
            console.log("Couldn't get all scenarios", error)
            return Promise.reject()
        })
    }

    static createScenario(name) {
        let data = {
            "name": name
        };

        return FetchJson(`${apiUrl}/api/Scenarios`, {
            method: 'POST',
            body: JSON.stringify(data)
        }).then(res => Promise.resolve(res))
    }

    static deleteScenario(id){
        return FetchJson(`${apiUrl}/api/Scenarios/${id}`, {
            method: 'DELETE',
        }).then(res => Promise.resolve(res))
    }

    static renameScenario(id, name){
        let data = {
            "name": name
        };

        return FetchJson(`${apiUrl}/api/Scenarios/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        }).then(res => Promise.resolve(res))
    }

    static getScenario(id){
        return FetchJson(`${apiUrl}/api/Scenarios/${id}`, {
            method: 'GET',
        }).then(res => Promise.resolve(res))
    }

    static uploadScenario(id, file) {
        const formData = new FormData();
        formData.append("file", file);

        return FetchWithoutContentType(`${apiUrl}/api/Scenarios/${id}/upload`, {
            method: 'POST',
            body: formData
        })
        .then(res => Promise.resolve(res))
    }

    static downloadScenario(id) {
        return FetchJson(`${apiUrl}/api/Scenarios/${id}/download`, {
            method: 'GET'
        }).then(res => Promise.resolve(res))
    }

    /**
     * 
     * ScenarioAsset
     * 
     */

    static getAllScenarioAssets(id) {
        return FetchJson(`${apiUrl}/api/ScenarioAssets/${id}`, {
            method: 'GET'
        }).then(res => Promise.resolve(res))
    }

    static uploadScenarioAsset(id, file) {
        const formData = new FormData();
        formData.append("file", file);

        return FetchWithoutContentType(`${apiUrl}/api/ScenarioAssets/${id}/upload`, {
            method: 'POST',
            body: formData
        }).then(res => Promise.resolve(res))
    }

    static downloadScenarioAsset(id) {
        return FetchFile(`${apiUrl}/api/ScenarioAssets/${id}/download`, {
            method: 'GET'
        }).then(res => Promise.resolve(res))
    }


    static createScenarioAsset(name, scenarioId){

        let data =
        {
            "name": name,
            "scenarioId": scenarioId
        }

        return FetchJson(`${apiUrl}/api/ScenarioAssets`, {
            method: 'POST',
            body: JSON.stringify(data)
        }).then(res => Promise.resolve(res))
    }

    static deleteScenarioAsset(id) {
        return FetchJson(`${apiUrl}/api/ScenarioAssets/${id}`, {
            method: 'DELETE'
        }).then(res => Promise.resolve(res))
    }

    static uploadFileAsNewAsset(file){

        let filename;
        let assetId;

        console.log(file);

        if (file != undefined) {
            filename = file.name;

            return createAsset(filename, Scenario.currentScenarioId)
            .catch(error => {
                message("asset creation failed", error)
                return Promise.reject()
            })
            .then(() => uploadAsset(assetId, file))
            .catch(error => message("asset upload failed", error))
            
        } else {
            message("File undefined!");
            return;
        }


        function createAsset(name, scenarioId){

            return BackendAPI.createScenarioAsset(filename, Scenario.currentScenarioId)
            .then(res => {
                assetId = res["id"];
                console.log(assetId)
            })
            .then(res => console.log("scenario asset created", assetId))            
        }

        function uploadAsset(id, file){

            console.log(id);
            return BackendAPI.uploadScenarioAsset(id, file)
            .then(res => console.log("scenario asset uploaded", res))
        }

    }

    

}

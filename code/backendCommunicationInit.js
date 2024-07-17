/**
 * Original author:	Anastasia Surikova
 * Modified by:     Michal Mráz
 * Created:   		29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/

const allowedOrigins = ['http://localhost:3000', 'http://anastasiasurikova.com', 'https://editor.eduard.fel.cvut.cz', 'http://localhost:8000'],
    // apiUrl = 'https://deveduard.azurewebsites.net';
    apiUrl = 'https://api.eduard.fel.cvut.cz';
    

window.addEventListener("message", receiveMessage, false);


function receiveMessage(event) {

    console.log('Origin', event.origin);

    if (allowedOrigins.indexOf(event.origin) === -1) {
        console.log('Origin is not allowed');
        return;
    }

    console.log('Origin is allowed', event.data);

    // Set access token
    setToken(event.data.idToken);
    console.log('Token was set', getToken());

    // Test communication
    testBackendCommunication();
}

/**
 * Test backend communication
 */
function testBackendCommunication(){
    BackendAPI.getAllScenarios()
    .then(
        scenarios => {
            console.log('Communication working, Scenarios:', scenarios)
        }, 
        () => {}
    )
}

/**
 * Token refresh
 */
function refreshExistingToken(){
    BackendAPI.refreshExistingToken()
    .then(res => {
        console.log("Refreshed token");
        // console.log("Refreshed token", res);

        setToken(res["accessToken"]["token"]);
        setRefreshToken(res["refreshToken"]);
        },
        () => {}
    )

}


let login = signIn;

/**
 * Sign in using login and password
 */
function signIn(login, password){

    BackendAPI.signIn(login, password)
    .then(res => {
        console.log(res);
        setToken(res["accessToken"]["token"]);
        setRefreshToken(res["refreshToken"])
    })
    .catch(
        error => message("Couldn't sign in", error)
    )

}


/**
 * 
 * Set and get tokens
 * 
 */
function setToken(token) {
    return localStorage.setItem('id_token', token);
}

function getToken() {
    return localStorage.getItem('id_token');
}

function setRefreshToken(token){
    localStorage.setItem("refreshToken", token);
}

function getRefreshToken(){
    return localStorage.getItem("refreshToken");
}




/**
 *
 *  Authorization & Backend fetch
 *
 **/

function isLoggedIn() {
    const token = getToken();
    return !!token;
}

function FetchJson(url, options) {

    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

    if(isLoggedIn()) {
        headers['Authorization'] = 'Bearer ' + getToken();
    }

    return fetch(url, {
        headers,
        ...options
    })
    .then(checkStatus)
    .then(response => {
        return response.text()
        .then(text => {
            return text ? JSON.parse(text) : {}
        });
    })
    .catch((error) => {
        // console.log('Unauthorized')
        console.log(error)
        throw error;
    })
}

/**
 * For uploading Scenario
 * @param {*} url 
 * @param {*} options 
 */
function FetchWithoutContentType(url, options) {

    const headers = {
        'Accept': 'application/json'
    }

    if(isLoggedIn()) {
        headers['Authorization'] = 'Bearer ' + getToken();
    }

    return fetch(url, {
        headers,
        ...options
    })
        .then(checkStatus)
        .then(response => {
            return response.text().then(function (text) {
                return text ? JSON.parse(text) : {}
            });
        })
        .catch((error) => {
            // console.log('Unauthorized')
            console.log(error)
        })
}

/**
 * For downloading image
 * @param {*} url 
 * @param {*} options 
 */
function FetchFile(url, options) {

    const headers = {
        'Accept': 'image'
    }

    if(isLoggedIn()) {
        headers['Authorization'] = 'Bearer ' + getToken();
    }

    return fetch(url, {
        headers,
        ...options
    })
    .then(checkStatus)
    .then(response => response.blob())
    .catch((error) => {
        console.log(error)
    })
}

function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
        // response.json().then(response => console.log(response), ()=>{})
        return response
    } else {
        let error = new Error(response.statusText);
        error.response = response;

        // Displaying the JSON message when error occurs
        response.json().then(jsonResponse => {
            console.log(jsonResponse);
            message(jsonResponse.title)
        }, 
        ()=>{})

        throw error
    }
}

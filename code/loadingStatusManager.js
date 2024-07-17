/**
 * Original author	Michal Mráz
 * Created:   	  	29.12.2020
 * Project:         EduARd project at FEE CTU in Prague.
 **/

/**
 * Loading status manager - tracks how many loading actions are in progress, if there is more than zero a loading wheel is displayed
 * When we begin a task that's expected to take a long time, we increment the counter of LoadingStateManager. When the task finishes, we decrement the counter.
 */
class LoadingStateManager {
    static instance = undefined;

    static initialize(){
        LoadingStateManager.instance = new LoadingStateManager();
        LoadingStateManager.instance.loadingCount = 0;
    }

    static incrementLoadingCount(){
        LoadingStateManager.instance.loadingCount += 1;
        this.refreshLoadingDisplay()
    }

    static decrementLoadingCount(){
        LoadingStateManager.instance.loadingCount -= 1;
        this.refreshLoadingDisplay()
    }

    static refreshLoadingDisplay(){
        var count = LoadingStateManager.instance.loadingCount;
        if(count > 0){
            turnOnOverlay("loadingOverlay");
        } else {
            turnOffOverlay("loadingOverlay");
        }
    }
}


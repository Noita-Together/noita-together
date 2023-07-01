interface Window {
    electronApi: {
        getOfflineMode: ()=>Promise<boolean>
    }
}
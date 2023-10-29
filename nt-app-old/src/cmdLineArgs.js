const { app } = require('electron')

class CmdLineArgs {
    constructor() {
        this.offline = false
        this.noUpdate = false
        this.allowRemoteNoita = false

        this.offline = app.commandLine.hasSwitch("nt-offline")
        this.noUpdate = app.commandLine.hasSwitch("nt-noupdate")
        this.allowRemoteNoita = app.commandLine.hasSwitch("nt-allow-remote-noita")
    }

    isOfflineMode() {
        return this.offline
    }

    isNoUpdate() {
        return this.noUpdate
    }

    isAllowRemoteNoita() {
        return this.allowRemoteNoita
    }
}

module.exports = new CmdLineArgs()

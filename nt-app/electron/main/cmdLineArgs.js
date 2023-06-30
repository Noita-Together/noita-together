import {app} from "electron";


class CmdLineArgs {
    constructor() {
        this.offline = false
        this.noUpdate = false
        this.allowRemoteNoita = false

        this.offline = app.commandLine.hasSwitch("nt-offline") || process.env.NT_OFFLINE
        this.noUpdate = app.commandLine.hasSwitch("nt-noupdate") || process.env.NT_NOUPDATE
        this.allowRemoteNoita = app.commandLine.hasSwitch("nt-allow-remote-noita") || process.env.NT_ALLOW_REMOTE_NOITA
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

const cmdArgs = new CmdLineArgs()

export default cmdArgs
import path from 'path'
import {app, BrowserWindow, ipcMain, shell} from 'electron'
import serve from 'electron-serve'
import {createWindow} from './helpers'
import * as process from "process";
import {authHandler} from "./helpers/auth-handler";
import {WebsocketLobby} from "./websocket-lobby";

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
    serve({directory: 'app'})
} else {
    app.setPath('userData', `${app.getPath('userData')} (development)`)
}

export interface ServerConfig{
    login_entry: string,
    api: string,
    ws: string,
    is_ws_secure: string
}

let lobbyWS: WebsocketLobby | null = null

let windowIsReady: boolean = false
let mainWindow: BrowserWindow | null = null
let defaultConfig: ServerConfig | null

const getMainWindowWhenReady = async () => {
        if (!windowIsReady) {
            await new Promise((resolve) => ipcMain.once('window-is-ready', resolve))
        }
        return mainWindow
    }

;(async () => {
    const gotTheLock = app.requestSingleInstanceLock()
    if (!gotTheLock) {
        app.quit()
        return false
    }

    // noitatogether://canyouseethis
    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient('noitatogether', process.execPath, [path.resolve(process.argv[1])])
        }
    } else {
        app.setAsDefaultProtocolClient('noitatogether')
    }
    await app.whenReady()

    ipcMain.once('window-is-ready', () => {
        windowIsReady = true
    })

    mainWindow = createWindow('main', {
        width: 1000,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    })

    if (isProd) {
        await mainWindow.loadURL('app://./home')
    } else {
        const port = process.argv[2]
        await mainWindow.loadURL(`http://localhost:${port}/home`)
        mainWindow.webContents.openDevTools()
    }
    fetch('https://raw.githubusercontent.com/Noita-Together/noita-together/main/default-server-config.json')
        .then(r => r.json())
        .then(json => {
            defaultConfig = json
            mainWindow.webContents.send('configuration', defaultConfig)
        })
})()

app.on('second-instance', async (_event, args) => {
    console.log(args)
    logEverywhere('second-instance')

    const url = args.find((arg) => {
        return arg.startsWith(`noitatogether://`)
    })
    if(url){
        const urlPath = url.split('noitatogether://')[1]
        if(urlPath.startsWith('oauth/token/success')){
            mainWindow.webContents.send('login-event', 'success')
            // token = urlPath.split('oauth/token/success?token=')[1]
            await authHandler.save(url)
            logEverywhere(`browser-data token is something`)
            lobbyWS = new WebsocketLobby(authHandler.accessToken, defaultConfig)
        }
        else if(urlPath.startsWith('oauth/token/failed')){
            mainWindow.webContents.send('login-event', 'failed')
            logEverywhere(`Login failed with code ${urlPath.split('oauth/token/failed?code=')[1]}`)
        }
    }

    mainWindow.isMinimized() && mainWindow.restore()
    mainWindow.focus()
})

app.on('open-url', async (_event, url) => {
    if(url){
        ipcMain.emit('browser-data', url)
    }
    mainWindow.isMinimized() && mainWindow.restore()
})

app.on('window-all-closed', () => {
    lobbyWS?.close()
    app.quit()
})

ipcMain.on('message', async (event, arg) => {
    event.reply('message', `${arg} World!`)
})

ipcMain.on('beginTwitchLogin', (event, returningUser) => {
    console.log(`Login with ${process.env.ELECTRON_WEBPACK_APP_LOGIN_URI}`)
    authHandler.doFreshLogin(defaultConfig)
})

// Log both at dev console and at running node console instance
function logEverywhere(s) {
    console.log(s)
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.executeJavaScript(`console.log("electron: ${s}")`)
    }
}
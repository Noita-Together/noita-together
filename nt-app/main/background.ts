import path from 'path'
import {app, BrowserWindow, ipcMain} from 'electron'
import serve from 'electron-serve'
import {createWindow} from './helpers'

const isProd = process.env.NODE_ENV === 'production'

if (isProd) {
    serve({directory: 'app'})
} else {
    app.setPath('userData', `${app.getPath('userData')} (development)`)
}

let token = null

let windowIsReady: boolean = false
let mainWindow: BrowserWindow | null = null

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
            token = urlPath.split('oauth/token/success?token=')[1]
            logEverywhere(`browser-data token is ${token}`) // TODO TODO TODO DO NOT MERGE TO PRODUCTION
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
    app.quit()
})

ipcMain.on('message', async (event, arg) => {
    event.reply('message', `${arg} World!`)
})

// Log both at dev console and at running node console instance
function logEverywhere(s) {
    console.log(s)
    if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.executeJavaScript(`console.log("electron: ${s}")`)
    }
}
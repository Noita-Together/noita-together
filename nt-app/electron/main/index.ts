import { distFolder, publicFolder } from "./root-path";
import { app, BrowserWindow, shell, ipcMain, dialog } from "electron";
import { join } from "path";
import { autoUpdater } from "electron-updater";
import { updateMod } from "./update";
import { appEvent } from "./appEvent";
import wsClient from "./ws";
// import keytar from "keytar"; // TODO: This could be replaced with Electron's safeStorage https://freek.dev/2103-replacing-keytar-with-electrons-safestorage-in-ray
import got from "got";
import http from "http";
import { getDb } from "./database";
import { ipc } from "./ipc-main";
import jwt from 'jsonwebtoken';
import cmdLineArgs from "./cmdLineArgs";
import {NoitaTogetherWebsocket} from "../../../nt-server";
import {globalAPI} from "../../src/util/ApiUtil";

let rememberUser = false;
let noitaServer: NoitaTogetherWebsocket|null;

if (!process.env.VITE_APP_HOSTNAME_PUBLIC || !process.env.VITE_APP_WS_PORT_PUBLIC) {
  console.error(
    "Please set the VITE_APP_HOSTNAME_PUBLIC, VITE_APP_WS_PORT_PUBLIC environment variables"
  );
}

// Only a single instance of the app can be running at a time.
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}
app.on("second-instance", showOrCreateWindow);

// Not sure about this, I've seen a few people complain about various driver bugs
// and other issues that are related to Electron/Chrome hardware acceleration.
app.disableHardwareAcceleration();

// Set application name for Windows 10+ notifications
if (process.platform === "win32") app.setAppUserModelId(app.getName());

// Browser window
let win: BrowserWindow | null = null;

export interface TwitchDecodedToken {
  preferred_username: string,
  sub: string
}

const loginServer = http.createServer((req, res) => {
  const url = new URL("noitatogether:/" + req.url);
  const token = url.searchParams.get("token");
  if(!token) {
    res.writeHead(400)
    res.end('Missing required param "token"')
    return
  }
  const refreshToken = url.searchParams.get("refresh")
  const extra = url.searchParams.get("e")

  const jwtDecoded = jwt.decode(token) as TwitchDecodedToken
  const {preferred_username, sub} = jwtDecoded
  if (!preferred_username) {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    res.end('nothing here.')
    return
  }
  if (rememberUser) {
    if(!refreshToken){
      res.writeHead(400, { 'Content-Type': 'text/html' })
      res.end('Remember User call should contain refresh token!')
      return
    }
    // keytar.setPassword("Noita Together", preferred_username, refreshToken)
  }
  appEvent("USER_EXTRA", extra)
  wsClient({
    display_name: preferred_username,
    token,
    id: sub
  }, {})

  if (win) {
    if (win.isMinimized()) {
      win.restore();
    }
    win.focus();
  }

  res.writeHead(200, { "Content-Type": "text/html" });
  res.end("You can close this.");
  //loginserv.close()
});

async function createWindow() {
  win = new BrowserWindow({
    title: "Noita Together",
    transparent: false,
    icon: join(publicFolder, "favicon.ico"),
    frame: false,
    thickFrame: true,
    width: 800,
    minWidth: 400,
    height: 700,
    minHeight: 600,
    backgroundColor: "#2e2c29",
    resizable: true,
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  if (import.meta.env.PROD) {
    win.webContents.openDevTools();
  } else {
    win.webContents.openDevTools();
  }

  if (import.meta.env.PROD) {
    win.loadFile(join(distFolder, "index.html"));
  } else {
    win.loadURL(
      `http://${process.env.VITE_DEV_SERVER_HOST}:${process.env.VITE_DEV_SERVER_PORT}`
    );
  }

  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });
}

ipc.answerRenderer("setGamePath", async (path) => {
  const db = await getDb();
  db.data.storage.gamePath = path;
  await db.write();
});

ipc.answerRenderer("getGameSaves", async () => {
  const db = await getDb();
  return db.data.games.map((v) => {
    return {
      id: v.id,
      name: v.name,
      gamemode: v.gamemode,
      timestamp: v.timestamp,
    };
  });
});

ipcMain.on("update_mod", (event) => {
  if(cmdLineArgs.isNoUpdate())
  {
    appEvent("skip_update", true)
    return
  }
  // keytar.findCredentials("Noita Together").then((credentials) => {
  //   if (credentials.length > 0) {
  //     const username = credentials[0].account;
  //     appEvent("SAVED_USER", username);
  //   }
  // });
  updateMod();
});

ipcMain.on("remember_user", (event, val) => {
  rememberUser = val;
});

ipcMain.on("enable-server", (event, val) => {
  noitaServer = new NoitaTogetherWebsocket(5466, val)
  noitaServer.startServer()
  appEvent("USER_EXTRA", {})
  globalAPI.lanIP = 'localhost'
  wsClient({
    display_name: 'host',
    token: undefined,
    id: Math.random()
  }, {offline: {
      code: 'uguu',
      username: 'Host'
    }})
})

ipcMain.on('join-hosted-server', (event, code, username, host)=>{
  globalAPI.lanIP = host
  wsClient({
    display_name: 'host',
    token: undefined,
    id: Math.random()
  }, {offline: {
      code: code,
      username: username
    }})
})

ipcMain.on("disable-server", ()=>{
  noitaServer?.stopServer()
  noitaServer = null
})

ipcMain.on("TRY_LOGIN", async (event, account) => {
  appEvent("TRY_LOGIN_FAILED", "");
  // try {
  //   const token = await keytar.getPassword("Noita Together", account);
  //   const { body } = await got.post(
  //     `https://${process.env.VITE_APP_HOSTNAME}/auth/refresh`,
  //     {
  //       json: {
  //         ticket: token,
  //       },
  //       responseType: "json",
  //     }
  //   );
  //   const { display_name, ticket, id, e } = body as any;
  //   appEvent("USER_EXTRA", e);
  //   wsClient({
  //     display_name,
  //     token: ticket,
  //     id,
  //   }, {});
  // } catch (error) {
  //   console.error(error);
  //   appEvent("TRY_LOGIN_FAILED", "");
  // }
});

ipcMain.on("minimize-window", () => {
  win?.minimize();
});

ipcMain.handle("open-directory-dialog", () => {
  return dialog.showOpenDialog({ properties: ["openDirectory"] });
});

ipcMain.handle("get-version", () => {
  return app.getVersion();
});

ipcMain.on("open-login-twitch", () => {
  const loginUrl = `https://${process.env.VITE_APP_HOSTNAME}/auth/login`;
  shell.openExternal(loginUrl);
});

autoUpdater.on("update-downloaded", () => {
  appEvent("UPDATE_DOWNLOADED", "");
});

app
  .whenReady()
  .then(showOrCreateWindow)
  .catch((e) => console.error("Failed create window:", e));

app.on("ready", async () => {
  loginServer.listen(25669);
});

if (import.meta.env.DEV) {
  // TODO: https://codybontecou.com/electron-app-with-vue-devtools.html#running-the-vue-devtools-as-a-dependency
  /*
  app
    .whenReady()
    .then(() => import("electron-devtools-installer"))
    .then(({ default: installExtension, VUEJS3_DEVTOOLS }) =>
      installExtension(VUEJS3_DEVTOOLS, {
        loadExtensionOptions: {
          allowFileAccess: true,
        },
      })
    )
    .catch((e) => console.error("Failed install extension:", e));*/
}

if (import.meta.env.PROD) {
  app
    .whenReady()
    .then(() => import("electron-updater"))
    .then(({ autoUpdater }) => autoUpdater.checkForUpdatesAndNotify())
    .catch((e) => console.error("Failed check updates:", e));
}

let asyncCleanupPromise: Promise<void> | null = null;

app.on("window-all-closed", () => {
  win = null;

  if (asyncCleanupPromise === null) {
    asyncCleanupPromise = Promise.race([
      getDb().then((db) => db.write()),
      new Promise<void>((res) => setTimeout(() => res(), 1000)),
    ]).finally(() => {
      app.quit();
    });
  }

  /*if (process.platform !== "darwin") {
    app.quit();
  }*/
});

app.on("activate", showOrCreateWindow);

async function showOrCreateWindow() {
  const allWindows = BrowserWindow.getAllWindows();
  if (allWindows.length > 0) {
    allWindows[0].focus();
  } else {
    await createWindow();
  }
}

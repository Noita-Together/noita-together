import dotenv from "dotenv";
dotenv.config();
import fs from 'fs';

if(!process.env.WEBSERVER_AUTH_URL) throw new Error("Unable to load .env!")

const uaccess_file = `.uaccess`
if (!fs.existsSync(uaccess_file)) {
    console.log('Creating empty uaccess file')
    fs.writeFileSync(uaccess_file, '', 'utf-8')
}
if(process.env.DEV_MODE === 'true') console.log('!!!Server is in DEV mode. Only developers can create rooms!!!')

import { NoitaTogetherWebsocket } from './websocket';
import path from 'path';

//Delete old stats on boot up. For now we do NOT want to persist this data
const statsStorageDirectory = path.join(__dirname, `.storage/stats/`)
try {
    if (fs.existsSync(statsStorageDirectory)) {
        fs.rmSync(statsStorageDirectory, {recursive: true})
    }
} catch (e) {
    console.error(`Failed to delete stale html stats!`)
    console.error(e)
}

const websocket = new NoitaTogetherWebsocket()
websocket.startServer()
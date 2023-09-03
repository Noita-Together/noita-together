import dotenv from "dotenv";
dotenv.config();
import fs from 'fs';

const uaccess_file = `.uaccess`
if (!fs.existsSync(uaccess_file)) {
    console.log('Creating empty uaccess file')
    fs.writeFileSync(uaccess_file, '', 'utf-8')
}

if(process.env.DEV_MODE === 'true') console.log('!!!Server is in DEV mode. Only developers can create rooms!!!')

import * as http from 'http';
import next from "next";
import { NoitaTogetherWebsocket } from './websocket';
import { parse } from "url";
import { getServerAccessToken } from "./utils/TwitchUtils";
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

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// when using middleware `hostname` and `port` must be provided below
let tokensPromise = getServerAccessToken()

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
app.prepare().then(async () => {
    const tokens = await tokensPromise
    if(!tokens?.access_token) throw new Error("Unable to authenticate with twitch!")
    const websocket = new NoitaTogetherWebsocket()
    websocket.startServer()
    http.createServer(async (req, res) => {
        try {
            if (!req.url) return

            const parsedUrl = parse(req.url, true);
            const { pathname, query } = parsedUrl;
            // Check if the URL matches the desired pattern
            if (pathname && pathname.includes('/room/stats/') && pathname.split('/').length === 5) {
                let params = pathname.split('/')
                const room_id = params[3] as string;
                const session_id = params[4] as string;

                // Read the HTML file and serve it
                const filePath = path.join(__dirname, `.storage/stats/${room_id}/${session_id}/stats-final.html`);
                fs.readFile(filePath, 'utf-8', (err, data) => {
                    if (err) {
                        console.error('Error reading file:', err);
                        res.statusCode = 404;
                        res.end('404 stats not found');
                    } else {
                        // Replace any dynamic values in the HTML file with room_id and session_id
                        // const modifiedData = data.replace('[room_id]', room_id).replace('[session_id]', session_id);
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end(data);
                    }
                });
            } else {
                // For other URLs, let Next.js handle them
                await handle(req, res, parsedUrl);
            }
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    })
        .once('error', (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});
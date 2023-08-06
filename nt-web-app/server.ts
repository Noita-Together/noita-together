import dotenv from "dotenv";
dotenv.config();

import * as http from 'http';
import next from "next";
import { NoitaTogetherWebsocket } from './websocket';
import { parse } from "url";
import { getServerAccessToken } from "./utils/TwitchUtils";
import fs from 'fs';
import path from 'path';

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
            if (pathname === '/[room_id]/[session_id]/stats') {
                const room_id = query.room_id as string;
                const session_id = query.session_id as string;

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
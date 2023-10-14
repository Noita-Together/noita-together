// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import * as fs from "fs";
import path from "path";

export type StatusApiResponse = string

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<StatusApiResponse>
) {
    console.log(req)
    // Read the HTML file and serve it
    const filePath = path.join(__dirname, `../../../../../../../.storage/stats/${req.query.id}/${req.query.sessionId}/stats-final.json`);
    fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            res.statusCode = 404;
            res.end('404 stats not found');
        } else {
            // Replace any dynamic values in the HTML file with room_id and session_id
            // const modifiedData = data.replace('[room_id]', room_id).replace('[session_id]', session_id);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(data);
        }
    });

}

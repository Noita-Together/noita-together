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
    if(!fs.existsSync(filePath)){
        console.error(`Error reading stats file: ${filePath}`);
        res.statusCode = 404;
        res.end('404 stats not found');
        return
    }
    const data = fs.createReadStream(filePath, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    data.pipe(res);
}

// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import {getStatsUrl} from "../../../../../utils/GameServerApi";

export type StatusApiResponse = string

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<StatusApiResponse>
) {
    const data = await fetch(getStatsUrl(req.query.id as string, req.query.sessionId as string))
    const stats = await data.text()
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(stats)
}

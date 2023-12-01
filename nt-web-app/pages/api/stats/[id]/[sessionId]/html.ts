// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type {NextApiRequest, NextApiResponse} from 'next'
import {buildColumn, buildRow, templateHtml} from '../../../../../websocket/stats/templatebuilder'
import {getStatsUrl, Stats, StatsRowValue} from '../../../../../utils/GameServerApi'

export type StatusApiResponse = string

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<StatusApiResponse>
) {
    const data = await fetch(getStatsUrl(req.query.id as string, req.query.sessionId as string))
    const stats = await data.json() as Stats

    const headers = stats.headings
    const userElements = stats.rows.map((user: StatsRowValue[], index: number) => {
        return buildRow(user, index)
    })
    const columns = headers.map((header: string, index: number) => {
        return buildColumn(header, index)
    })

    const replaceDataTemplate: { [key: string]: any } = {
        'INSERT_HEADERS_HERE': columns.join(''),
        'INSERT_STATS_HERE': userElements.join(''),
        'room-name': stats.name ?? stats.id
    }
    let finalHtml = templateHtml
    finalHtml = finalHtml.replace(/{([^{}]+)}/g, function (keyExpr: any, key: any) {
        return replaceDataTemplate[key] !== undefined ? replaceDataTemplate[key] : `{${key}}`;
    });

    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(finalHtml)
}

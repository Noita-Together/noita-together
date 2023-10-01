// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import {ClientRequest, IncomingMessage} from "http";
const ws = require("ws")

export type StatusApiResponse = {
    message: string,
    uptime?: string,
    error?: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<StatusApiResponse>
) {
    return new Promise<boolean>((resolve, reject)=>{
        let client = new ws(`ws://localhost:5466/uptime`)
        client.on('unexpected-response',(_: ClientRequest, mes: IncomingMessage)=>{
            if(mes.statusCode === 200){
                res.status(200).json({ message: 'ONLINE', uptime: mes.statusMessage??'??' })
                resolve(true)
            }
            try {
                client.close(0)
            } catch (e) {
            }
            resolve(true)
        })
        client.on('error',()=>{
            try {
                client.close(0)
            } catch (e) {
            }
            reject(false)
        })
    }).then(()=>{

    }).catch((e)=>{
        res.status(500).json({ message: 'DOWN', error: e.message })
    })

}

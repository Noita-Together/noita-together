// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import {randomUUID} from "crypto";

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID as string
const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI as string

type Data = {
    name: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    const deviceCode = req.query.deviceCode
    const redirectUri = encodeURIComponent(OAUTH_REDIRECT_URI + req.query.redirect_uri ?? '/api/auth/code');
    const scope = encodeURIComponent('openid'); //Scopes here. We should not need any though :P
    const state = deviceCode ?? randomUUID();

    const url = `https://id.twitch.tv/oauth2/authorize?response_type=code&client_id=${TWITCH_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;

    res.writeHead(302, { Location: url });
    res.end();
}

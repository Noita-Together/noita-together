// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { randomUUID } from "crypto";
import { getRedirectURL } from "../../../identity/identity";

const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI as string

type Data = {
    name: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    const deviceCode = req.query.deviceCode
    const redirectUri = encodeURIComponent(OAUTH_REDIRECT_URI + '/api/auth/code');
    const scope = encodeURIComponent('openid'); //Scopes here. We should not need any though :P
    const state = deviceCode ?? randomUUID();

    const url = getRedirectURL(redirectUri, scope, state.toString());

    res.writeHead(302, { Location: url });
    res.end();
}

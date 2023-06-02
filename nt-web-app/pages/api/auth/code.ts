// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios';
const TWITCH_API_KEY = process.env.TWITCH_API_KEY as string
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID as string
const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI as string
const NOITA_APP_REDIRECT_URI = process.env.NOITA_APP_REDIRECT_URI as string

type Data = {
    data?: {
        refresh_token: string
        id_token: string
        access_token: string
        expires_in:number
    }
    error?: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    const clientID = TWITCH_CLIENT_ID;
    const clientSecret = TWITCH_API_KEY;
    const code = req.query.code as string;
    const redirectUri = OAUTH_REDIRECT_URI+'/api/auth/code';
    console.log(`RedirectUri: ${redirectUri}`)
    const grantType = 'authorization_code';

    try {
        const response = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: clientID,
                client_secret: clientSecret,
                code: code,
                grant_type: grantType,
                redirect_uri: redirectUri,
            },
        });


        const { access_token, refresh_token, id_token, expires_in } = response.data;

        // Handle the received access_token and refresh_token as desired

        //Debug only!
        // res.status(200).json({
        //     data: {
        //         access_token, refresh_token, id_token, expires_in
        //     }
        // });

        const url = `${NOITA_APP_REDIRECT_URI}/?token=${id_token}&refresh=${refresh_token}&expires_in=${expires_in}`;

        res.writeHead(302, { Location: url });
        res.end();
    } catch (error) {
        // Handle error response
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve tokens :(' });
    }
}

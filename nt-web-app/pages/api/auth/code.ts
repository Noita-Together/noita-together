// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios';
import {UserDatasource, PendingConnectionDatasource} from "../../../websocket/Datasource";
import {defaultRoles, User} from "../../../entity/User";
import {getUser} from "../../../utils/TwitchUtils";
import {createAccessToken, createRefreshToken} from "../../../utils/jwtUtils";
import {PendingConnection} from "../../../entity/PendingConnection";
const TWITCH_API_KEY = process.env.TWITCH_API_KEY as string
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID as string
const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI as string
const NOITA_APP_REDIRECT_URI = process.env.NOITA_APP_REDIRECT_URI as string

const clientID = TWITCH_CLIENT_ID as string;
const clientSecret = TWITCH_API_KEY as string;

type Data = {
    data?: {
        refresh_token: string
        access_token: string
    }
    error?: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    const code = req.query.code as string;
    const state = req.query.state as string;
    console.log(JSON.stringify(req.query))
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

        const userData = await getUser(access_token)

        const db = await UserDatasource()
        if(!db){
            res.status(500).json({ error: 'Failed to retrieve tokens :(' });
            return
        }
        const repo = db.getRepository(User)

        const dbPendingConnection = await PendingConnectionDatasource()
        if(!dbPendingConnection){
            res.status(500).json({ error: 'Failed to retrieve tokens :(' });
            return
        }
        const repoPendingConnection = dbPendingConnection.getRepository(PendingConnection)

        const user = await repo.findOneBy({
            id: userData.id,
            provider: 'twitch'
        }).then(user=>{
            if(!user) return new User(userData.id, userData.display_name, defaultRoles, 'twitch')
            return user
        })

        user.display_name = userData.display_name
        repo.save(user)

        if (state.length === 8){

            const pendingConnection = await repoPendingConnection.findOneBy({
                userCode: state
            })
            if(!pendingConnection){
                res.status(400).end("No valid device code :(");
                return
            }
            pendingConnection.resolvedProvider = 'twitch'
            pendingConnection.resolvedUserId = user.id
            pendingConnection.save()

            res.status(200).end("you can close this.");
        }
        else{
            const accessToken = createAccessToken(userData)
            const refreshToken = createRefreshToken(userData)
            const url = `${NOITA_APP_REDIRECT_URI}/?token=${accessToken}&refresh=${refreshToken}&expires_in=28800`;

            res.writeHead(302, { Location: url });
            res.end();
        }
    } catch (error) {
        // Handle error response
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve tokens :(' });
    }
}


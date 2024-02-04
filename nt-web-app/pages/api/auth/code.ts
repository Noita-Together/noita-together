// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios';
import {UserDatasource} from "../../../websocket/Datasource";
import {defaultRoles, User} from "../../../entity/User";
import {getUser} from "../../../utils/TwitchUtils";
import {createAccessToken, createRefreshToken} from "../../../utils/jwtUtils";
import {PendingConnection} from "../../../entity/PendingConnection";
import fs from "fs";
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
    const redirectUri = OAUTH_REDIRECT_URI+'/api/auth/code';
    const grantType = 'authorization_code';
    console.log('/api/auth/code: Start')
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
            console.log('Failed to retrieve tokens :(')
            return
        }
        const repo = db.getRepository(User)
        const repoPendingConnection = db.getRepository(PendingConnection)

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
            let e = undefined
            try {
                const uaccessDataForUser = fs.readFileSync('.uaccess', 'utf-8')
                    .replace(/[\n\r]/g, '\n').split('\n')
                    .filter(a=>user.display_name === a || `${user.display_name}:dev` === a)
                if(uaccessDataForUser.length === 1){
                    e = uaccessDataForUser[0].endsWith(':dev') ? 3 : 2;
                }
            } catch (e: any) {
                // if file doesn't exist, treat as empty
                if (e?.code !== 'ENOENT') throw e;
            }
            console.log(`Logged in user has uacess of ${e}`)
            const url = `${NOITA_APP_REDIRECT_URI}/?token=${accessToken}&refresh=${refreshToken}&expires_in=28800${e ? `&e=${e}` : ''}`;

            res.writeHead(302, { Location: url });
            res.end();
        }
    } catch (error) {
        // Handle error response
        console.error('Error fetching tokens', error);
        //TODO log the error in a way that does not spam the console or leak secrets
        res.status(500).json({ error: 'Failed to retrieve tokens :(' });
    }
    console.log('/api/auth/code: End')
}


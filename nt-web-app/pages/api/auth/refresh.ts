import type {NextApiRequest, NextApiResponse} from 'next'
import {getUsersById} from "../../../utils/TwitchUtils";
import {createAccessToken, verifyToken, ACCESS_TOKEN_DURATION} from "../../../utils/jwtUtils";
import {UserDatasource} from "../../../websocket/Datasource";
import {LoginProvider, User} from "../../../entity/User";
import * as jwt from "jsonwebtoken";
import ms from 'ms'

const SECRET_ACCESS = process.env.SECRET_JWT_ACCESS as string
const SECRET_REFRESH = process.env.SECRET_JWT_REFRESH as string

interface Data {
    token: string,
    expires_in: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    console.log('/api/auth/refresh: User wants to refresh their access token!')
    const db = await UserDatasource()
    if (!db) {
        console.log('/api/auth/refresh: 500 Failed to interface with database')
        res.status(500).end("500 Failed to interface with database");
        return
    }
    const repository = db.getRepository(User)
    if (!req.headers['authorization'] || !req.headers['authorization'].includes('Bearer')) {
        console.log('/api/auth/refresh: 401 Unauthorized. Missing Authorization header')
        console.log(JSON.stringify(req.headers))
        res.status(401).end("401 Unauthorized. Missing Authorization header");
        return
    }
    const refresh = (req.headers['authorization'] as String).split('Bearer ')[1]

    //validate that we own the refresh token
    const verifiedJWT = await verifyToken(refresh, SECRET_REFRESH)
    if (!verifiedJWT) {
        console.log('/api/auth/refresh: 401 Unauthorized. Invalid refresh token')
        res.status(401).end("401 Unauthorized. Invalid refresh token");
        return
    }
    const userSub = verifiedJWT.sub
    const user = await repository.findOneBy({
        id: userSub
    })
    if (!user) {
        console.log('/api/auth/refresh: 404 User Not Found')
        res.status(404).end("404 User Not Found");
        return
    }

    const expiresIn = ms(ACCESS_TOKEN_DURATION)/1000 //ms to seconds, using the vercel ms library, as JWT lib does
    let accessKey: string

    switch (user.provider as LoginProvider) {
        case 'twitch':
            //get the user from the Twitch API using TWITCH_CLIENT_ID and TWITCH_API_KEY
            const userData = await getUsersById([userSub])
            if (!userData || userData.length === 0) {
                res.status(502).end("502 Failed to get twitch user data");
                return
            }
            //create the access token and give it to the user :)
            accessKey = createAccessToken(userData[0])
            break
        case 'local':
            //create the access token and give it to the user :)
            accessKey = jwt.sign({
                preferred_username: user.display_name,
                sub: user.id,
                profile_image_url: '',
                provider: 'local'
            }, SECRET_ACCESS, {
                expiresIn: ACCESS_TOKEN_DURATION
            })
            break
    }
    res.status(200).json({
        token: accessKey,
        expires_in: expiresIn.toString()
    });
}

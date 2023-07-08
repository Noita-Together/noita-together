import type { NextApiRequest, NextApiResponse } from 'next'

const TWITCH_API_KEY = process.env.TWITCH_API_KEY as string
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID as string
const SECRET_ACCESS = process.env.SECRET_JWT_ACCESS as string
const SECRET_REFRESH = process.env.SECRET_JWT_REFRESH as string

type Data = {
    token: string,
    expires_in: string
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Data>
) {
    //TODO validate that we own the refresh token
    //TODO get the user from the Twitch API using TWITCH_CLIENT_ID and TWITCH_API_KEY
    //TODO create the access token and give it to the user :)
}

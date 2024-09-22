import {TwitchGetUsersResponse, TwitchUserData} from "../entity/TwitchGetUsersResponse";
import axios, {AxiosResponse} from "axios";

const TWITCH_API_KEY = process.env.TWITCH_API_KEY as string
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID as string

const getUser = async (accessToken: string): Promise<TwitchUserData> => {
    return axios.get("https://api.twitch.tv/helix/users", {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Client-Id': TWITCH_CLIENT_ID
        }
    })
        .then((res: AxiosResponse<TwitchGetUsersResponse>)=>res.data)
        .then(data=>data.data[0])
}

const getUsersById = async (userIds: string[]): Promise<TwitchUserData[]|null> => {
    let tokens = await getServerAccessToken()
    if(!tokens) throw new Error("getUsersById: Unable to communicate with Twitch!")
    const query = userIds.map((userId)=>`id=${userId}`).join('&')
    return axios.get(`https://api.twitch.tv/helix/users?${query}`, {
        headers: {
            'Authorization': `Bearer ${tokens.access_token}`,
            'Client-Id': TWITCH_CLIENT_ID
        }
    })
        .then((res: AxiosResponse<TwitchGetUsersResponse>)=>res.data)
        .then(data=>data.data)
        .catch((e)=> {
            console.log(e)
            return null
        })
}

export interface TwitchAppAccessToken{
    access_token: string,
    expires_in: number,
    acquired_at?: number,
    token_type: string
}

let serverAccessToken: TwitchAppAccessToken|undefined = undefined

const getServerAccessToken = async(): Promise<TwitchAppAccessToken|null> => {
    if(serverAccessToken){
        let expiration = serverAccessToken.acquired_at!! + serverAccessToken.expires_in*1000
        if(Date.now() - expiration <= 120000){ //if the expiration is within 2 minutes, lets refresh the token
            console.log('Twitch API Token expired!')
            serverAccessToken = undefined
        }
        else return serverAccessToken
    }

    if(!serverAccessToken){
        console.log('Fetching access token for Twitch API...')
        const access: TwitchAppAccessToken|null = await axios.post('https://id.twitch.tv/oauth2/token', null, {
            params: {
                client_id: TWITCH_CLIENT_ID,
                client_secret: TWITCH_API_KEY,
                grant_type: 'client_credentials',
            },
        })
            .then((res: AxiosResponse<TwitchAppAccessToken>)=>res.data)
            .catch((e)=> {
                console.log(e)
                return null
            })
        if(access){
            access.acquired_at = Date.now()
            serverAccessToken = access
            console.log('Fetched Twitch API Token')
        }
        else{
            console.log('Failed to fetch Twitch API Token')
        }
    }
    return serverAccessToken!!
}

export {
    getServerAccessToken,
    getUser,
    getUsersById
}
import {TwitchGetUsersResponse, TwitchUserData} from "../entity/TwitchGetUsersResponse";
import axios, {AxiosResponse} from "axios";
import * as QueryString from "querystring";

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
    const query = userIds.map((userId)=>`id=${userId}`).join('&')
    return axios.get(`https://api.twitch.tv/helix/users?${query}`, {
        headers: {
            'Authorization': `Bearer ${TWITCH_API_KEY}`,
            'Client-Id': TWITCH_CLIENT_ID
        }
    })
        .then((res: AxiosResponse<TwitchGetUsersResponse>)=>res.data)
        .then(data=>data.data)
        .catch(()=>null)
}

export {
    getUser,
    getUsersById
}
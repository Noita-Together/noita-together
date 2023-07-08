//creating a access token
import jwt from "jsonwebtoken";
import {TwitchUserData} from "../entity/TwitchGetUsersResponse";

const SECRET_ACCESS = process.env.SECRET_JWT_ACCESS as string
const SECRET_REFRESH = process.env.SECRET_JWT_REFRESH as string

function createAccessToken(userData: TwitchUserData){
    return jwt.sign({
        preferred_username: userData.display_name,
        sub: userData.id,
        profile_image_url: userData.profile_image_url,
        provider: 'twitch'
    }, SECRET_ACCESS, {
        expiresIn: '8h'
    })
// Creating refresh token not that expiry of refresh
//token is greater than the access token
}

function createRefreshToken(userData: TwitchUserData){
    return jwt.sign({
        sub: userData.id,
    }, SECRET_REFRESH, {expiresIn: '5d'})
}

export {
    createAccessToken,
    createRefreshToken
}
//creating a access token
import jwt from "jsonwebtoken";
import {TwitchUserData} from "../entity/TwitchGetUsersResponse";

const SECRET_ACCESS = process.env.SECRET_JWT_ACCESS as string
const SECRET_REFRESH = process.env.SECRET_JWT_REFRESH as string
const REFRESH_TOKEN_DURATION = process.env.REFRESH_TOKEN_DURATION ?? '30d' //see https://github.com/vercel/ms for valid formats
const ACCESS_TOKEN_DURATION = process.env.REFRESH_TOKEN_DURATION ?? '1d' //see https://github.com/vercel/ms for valid formats

function createAccessToken(userData: TwitchUserData){
    return jwt.sign({
        preferred_username: userData.display_name,
        sub: userData.id,
        profile_image_url: userData.profile_image_url,
        provider: 'twitch'
    }, SECRET_ACCESS, {
        expiresIn: ACCESS_TOKEN_DURATION
    })
// Creating refresh token not that expiry of refresh
//token is greater than the access token
}

function createRefreshToken(userData: TwitchUserData){
    return jwt.sign({
        sub: userData.id,
    }, SECRET_REFRESH, {expiresIn: REFRESH_TOKEN_DURATION})
}

const verifyToken = (jwtToken: string, tokenSecret: string): any => {
    console.log('Verify JWT...')
    return new Promise((resolve, reject) => {
        jwt.verify(jwtToken, tokenSecret, {complete: true}, (err, decoded: any)=>{
            if (err) {
                console.log('Error!')
                reject(new Error(`JWT verification failed: ${err.message}`));
            } else {
                console.log(`We got ${JSON.stringify(decoded)}`)
                resolve(decoded.payload);
            }
        });
    });
}

export {
    createAccessToken,
    createRefreshToken,
    verifyToken,
    REFRESH_TOKEN_DURATION,
    ACCESS_TOKEN_DURATION
}
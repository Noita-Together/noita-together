//creating a access token
import jwt from "jsonwebtoken";
import { UserData } from "../entity/identity";
import { provider } from "../identity/identity";

const SECRET_ACCESS = process.env.SECRET_JWT_ACCESS as string
const SECRET_REFRESH = process.env.SECRET_JWT_REFRESH as string

function createAccessToken(userData: UserData) {
    return jwt.sign({
        sub: userData.sub,
        preferred_username: userData.preferred_name,
        profile_image_url: userData.picture,
        provider: provider
    }, SECRET_ACCESS, {
        expiresIn: '8h'
    })
    // Creating refresh token not that expiry of refresh
    //token is greater than the access token
}

function createRefreshToken(userData: UserData) {
    return jwt.sign({
        sub: userData.sub,
    }, SECRET_REFRESH, { expiresIn: '5d' })
}

const verifyToken = (jwtToken: string, tokenSecret: string): any => {
    console.log('Verify JWT...')
    return new Promise((resolve, reject) => {
        jwt.verify(jwtToken, tokenSecret, { complete: true }, (err, decoded: any) => {
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
    verifyToken
}

import jwt from "jsonwebtoken";

const verifyJwt = (jwtToken, tokenSecret) => {
    console.log('Verify JWT...')
    return new Promise((resolve, reject) => {
        jwt.verify(jwtToken, tokenSecret, {complete: true}, (err, decoded)=>{
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
    verifyJwt
}

import jwt from "jsonwebtoken";

const verifyJwt = (jwtToken, tokenSecret) => {
    return new Promise((resolve, reject) => {
        jwt.verify(jwtToken, tokenSecret, {complete: true}, (err, decoded)=>{
            if (err) {
                console.log('Error!')
                reject(new Error(`JWT verification failed: ${err.message}`));
            } else {
                resolve(decoded.payload);
            }
        });
    });
}

export {
    verifyJwt
}

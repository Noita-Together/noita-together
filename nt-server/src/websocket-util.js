import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";

const verifyJwt = (jwtToken, jwks) => {
    console.log('Verify JWT...')
    return new Promise((resolve, reject) => {
        const decodedToken = jwt.decode(jwtToken, {complete: true});

        const {header} = decodedToken;
        const {kid} = header;

        const jwk = jwks.keys.find((key) => key.kid === kid);

        if (!jwk) {
            reject(new Error(`JWK with kid ${kid} not found`));
            return
        }

        const publicKey = {
            e: jwk.e,
            kid: jwk.kid,
            kty: jwk.kty,
            n: jwk.n,
            use: jwk.use,
        };

        const options = {
            algorithms: [jwk.alg],
        };

        // Convert JWK to PEM format
        const pemPublicKey = jwkToPem(publicKey);
        jwt.verify(jwtToken, pemPublicKey, options, (err, decoded) => {
            if (err) {
                console.log('Error!')
                reject(new Error(`JWT verification failed: ${err.message}`));
            } else {
                resolve(decoded);
            }
        });
    });
}

export {
    verifyJwt
}

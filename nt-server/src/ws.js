const URL = require("url")
const path = require("path")
const jwt = require("jsonwebtoken")
const jwkToPem = require('jwk-to-pem');

const Lobby = require("./lobby")
const axios = require("axios");
let cachedJWKS = undefined

module.exports = (server) => {
    server.on('upgrade', async (req, socket, head) => {
        try {
            const url = URL.parse(req.url)
            const token = decodeURIComponent(path.basename(url.path))
            const user = await getUser(token)//Get user from token
            if (!user) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
                socket.destroy()
                return
            }

            Lobby.server.handleUpgrade(req, socket, head, (ws) => {
                Lobby.server.emit('connection', ws, req, user)
            })
        } catch (error) {

        }
    })
}

const fetchJWKS = async () => {
    console.log('Fetch JWKS...')
    const response = await axios.get('https://id.twitch.tv/oauth2/keys')
    console.log('Fetched!')
    return response.data
}

const verifyJwt = (jwtToken, jwks) => {
    console.log('Verify JWT...')
    return new Promise((resolve, reject) => {
        const decodedToken = jwt.decode(jwtToken, {complete: true});

        const {header} = decodedToken;
        const {kid} = header;

        const jwk = jwks.keys.find(key => key.kid === kid);

        if (!jwk) {
            reject(new Error(`JWK with kid ${kid} not found`));
        }

        const publicKey = {
            alg: jwk.alg,
            e: jwk.e,
            kid: jwk.kid,
            kty: jwk.kty,
            n: jwk.n,
            use: jwk.use,
        };

        const options = {
            algorithms: [publicKey.alg],
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

const getUser = async (token) => {
    if (!token) return null
    if (!cachedJWKS)
        cachedJWKS = await fetchJWKS()
    return verifyJwt(token, cachedJWKS)
        .then((jwtObject) => {
            return {
                id: jwtObject.sub,
                display_name: jwtObject['preferred_username']
            }
        })
        .catch((e) => {
            console.error('We failed to validate JWT :(. No user!')
            console.error(e)
            return null
        })
}
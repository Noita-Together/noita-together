const URL = require("url")
const path = require("path")
const jwt = require("jsonwebtoken")

const Lobby = require("./lobby")

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

const getUser = async (token)=>{
    if(!token) return null
    const jwtObject = jwt.decode(token)
    //TODO https://id.twitch.tv/oauth2/.well-known/openid-configuration to validate the JWT is valid
    return {
        id: jwtObject.sub,
        display_name: jwtObject['preferred_username']
    }
}
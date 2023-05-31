const URL = require("url")
const path = require("path")

const Lobby = require("./lobby")

module.exports = (server) => {
    server.on('upgrade', (req, socket, head) => {
        try {
            const url = URL.parse(req.url)
            const token = decodeURIComponent(path.basename(url.path))
            const user = {}//Get user from token
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
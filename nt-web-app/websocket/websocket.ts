import * as path from "path";
import * as http from "http";
import {Server} from "http";
import {verifyJwt} from "./websocket-util"
import {TwitchDecodedToken} from "shared-lib/types/Twitch"
import Lobby from "./lobby";

import axios from "axios";
import {PendingConnectionDatasource, UserDatasource} from "./Datasource";
import {defaultRoles, RoleImpl, User} from "../entity/User";
import {PendingConnection} from "../entity/PendingConnection";
import AuthSocket from "./authWebsocket";
import {Socket} from "net";

const SECRET_ACCESS = process.env.SECRET_JWT_ACCESS as string
const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID as string

if(!TWITCH_CLIENT_ID) throw new Error("Unable to load .env!")

const timeStart = Date.now()

const userDatasource = UserDatasource()
const pendingConnectionDatasource = PendingConnectionDatasource()

class NoitaTogetherWebsocket{
    readonly port?
    readonly offlineCode?: string|null
    private wsServer?: Server|null

    /**
     * Initialize a Noita Together Websocket Server
     * @param port The port to open. If not defined, this becomes 5466
     * @param offlineCode The code for the user to input to join the lobby of a private instance. If not provided,
     *  socket defaults to twitch authentication mode
     */
    constructor(port = 5466, offlineCode?: string) {
        this.port = port
        this.offlineCode = offlineCode
    }

    startServer(){
        this.wsServer = http.createServer()
        this.wsServer.listen(this.port, () => {
            console.log("Running.")
            this.subscribeEvents()
        })
    }

    stopServer(){
        if(!this.wsServer) return
        this.wsServer.closeAllConnections()
        this.wsServer.on("close", ()=>{
            this.wsServer = null
        })
        this.wsServer?.close()
        this.wsServer?.emit("close")
    }

    private static async GetUserFromDB(id: string): Promise<User|null>{
        const db = await userDatasource
        if(!db) return null
        const repository = db.getRepository(User)
        const user = await repository.findOneBy({
            id: id,
            provider: 'twitch'
        })
        if(!user) console.log(`Failed to return a user for ${id}!`)
        return user
    }

    private static async CreatePendingConnection(socket: Socket): Promise<PendingConnection|null>{
        const db = await pendingConnectionDatasource
        if(!db) return null
        const pendingConnection = new PendingConnection(socket)
        await pendingConnection.save()
        return pendingConnection
    }

    private subscribeEvents(){
        console.log("subscribeEvents...")
        this.wsServer?.on('upgrade', async (req, socket: Socket, head) => {
            try {
                if(!req.url){
                    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
                    socket.destroy()
                    return
                }
                const url = req.url.substring(1)
                const token = decodeURIComponent(path.basename(url))
                if(token === 'uptime'){
                    const message = `HTTP/1.1 200 ${new Date(timeStart).toISOString()}\r\n\r\n`
                    console.log(message)
                    socket.write(message)
                    socket.destroy()
                    return
                }

                if(token.startsWith('deviceAuth')){
                    const pendingConnection = await NoitaTogetherWebsocket.CreatePendingConnection(socket)
                    if (!pendingConnection) {
                        console.log(`HTTP/1.1 500 Internal Server Error`)
                        socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n')
                        socket.destroy()
                        return
                    }
                    AuthSocket.server.handleUpgrade(req, socket, head, (ws: any)=>{
                        AuthSocket.server.emit('connection', ws, req, pendingConnection)
                    })
                }
                else{
                    let user = await this.validateToken(token) //Get user from token

                    if (!user) {
                        console.log(`HTTP/1.1 401 Unauthorized`)
                        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
                        socket.destroy()
                        return
                    }

                    Lobby.server.handleUpgrade(req, socket, head, (ws: any) => {
                        Lobby.server.emit('connection', ws, req, user)
                    })
                }

            } catch (error) {

            }
        })
    }

    async validateToken(token: string) : Promise<User|null>{
        if (!token) return null
        if(this.offlineCode && token.startsWith(`offline/${this.offlineCode}`) && token.split('/').length === 3){
            return new User(`${Math.random()}`, token.split('/')[2], defaultRoles, 'local')
        }
        if(this.offlineCode) return null
        const verify: Promise<TwitchDecodedToken> = verifyJwt(token, SECRET_ACCESS)
        return verify
            .then((jwtObject: TwitchDecodedToken) => {
                return NoitaTogetherWebsocket.GetUserFromDB(jwtObject.sub)
            })
            .catch((e) => {
                console.error('We failed to validate JWT :(. No user!')
                console.error(e)
                return null
            })
    }
}

export {
    NoitaTogetherWebsocket
}
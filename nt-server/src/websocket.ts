import * as path from "path";
import * as http from "http";
import {Server} from "http";
import {verifyJwt} from "./websocket-util"
import {TwitchDecodedToken} from "shared-lib/types/Twitch"
import Lobby from "./lobby";

import axios from "axios";
import {UserDatasource, PendingConnectionDatasource} from "@/src/Datasource";
import {defaultRoles, RoleImpl, User} from "@/src/entity/User";
import {PendingConnection} from "@/src/entity/PendingConnection";

let cachedJWKS: string|undefined = undefined

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

    private async AddOrGetUserFromDB(id: string, twitch_username: string): Promise<User|null>{
        const db = await userDatasource
        if(!db) return null
        const repository = db.getRepository(User)
        let user = await repository.findOneBy({
            id: id
        })
        if(!user){
            user = new User(id, twitch_username, defaultRoles)
            await repository.save(user)
        }
        if(user.display_name !== twitch_username){
            user.display_name = twitch_username
            await repository.save(user)
        }
        return user
    }

    private async CreatePendingConnection(): Promise<User|null>{
        const db = await pendingConnectionDatasource
        if(!db) return null
        const respository = db.getRepository(PendingConnection)
        const pendingConnection = new PendingConnection()
        respository.save(pendingConnection)
        return new User(`pending:${pendingConnection.id}`,  `$pending_${pendingConnection.id}`, new RoleImpl())
    }

    private subscribeEvents(){
        console.log("subscribeEvents...")
        this.wsServer?.on('upgrade', async (req, socket, head) => {
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
            } catch (error) {

            }
        })
    }

    async validateToken(token: string) : Promise<User|null>{
        if (!token) return null
        if(this.offlineCode && token.startsWith(`offline/${this.offlineCode}`) && token.split('/').length === 3){
            return new User(`${Math.random()}`, token.split('/')[2], defaultRoles)
        }
        if(token.startsWith('stats')){
            const userId = Math.round(Math.random()*10000)
            return new User(`${userId}`, '', new RoleImpl({canWatchStats: true}))
        }
        if(token.startsWith('deviceAuth')){
            return this.CreatePendingConnection()
        }

        if(this.offlineCode) return null
        if (!cachedJWKS)
            cachedJWKS = await fetchJWKS()
        const verify: Promise<TwitchDecodedToken> = verifyJwt(token, cachedJWKS)
        return verify
            .then((jwtObject: TwitchDecodedToken) => {
                return this.AddOrGetUserFromDB(jwtObject.sub, jwtObject.preferred_username)
            })
            .catch((e) => {
                console.error('We failed to validate JWT :(. No user!')
                console.error(e)
                return null
            })
    }
}

const fetchJWKS = async () => {
    console.log('Fetch JWKS...')
    const response = await axios.get('https://id.twitch.tv/oauth2/keys')
    console.log('Fetched!')
    return response.data
}

export {
    NoitaTogetherWebsocket
}
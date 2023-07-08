import WebSocket, {createWebSocketStream, Server} from "ws";
import {PendingConnection} from "../entity/PendingConnection";
import {PendingConnectionDatasource, UserDatasource} from "./Datasource";
import * as http from "http";
import { Repository } from "typeorm";
import {User} from "../entity/User";
import stream from "node:stream";
import {TwitchUserData} from "../entity/TwitchGetUsersResponse";
import {createAccessToken, createRefreshToken} from "../utils/jwtUtils";
import {getUsersById} from "../utils/TwitchUtils";

const SOCKET_TIMEOUT_SECONDS = 5*60

class AuthWebsocket {
    server: WebSocket.Server
    pendingConnections: Map<string, PendingConnection>
    userRepository?: Repository<User>
    pendingConnectionRepository?: Repository<PendingConnection>
    timeout?: NodeJS.Timeout

    constructor() {
        this.server = new WebSocket.Server({noServer: true, perMessageDeflate: false})
        this.pendingConnections = new Map<string, PendingConnection>()
        PendingConnectionDatasource()
            .then((db) => this.pendingConnectionRepository = db?.getRepository(PendingConnection))
        UserDatasource()
            .then((db) => this.userRepository = db?.getRepository(User))

        this.timeout = setTimeout(()=>this.CheckUsers(), 5000)

        this.server.on(
            "connection",
            (
                socket: WebSocket.Server,
                req: http.IncomingMessage,
                user: PendingConnection
            ) => this.OnConnection(socket, req, user)
        )
    }

    async OnConnection(ws: WebSocket.Server<any>, req: http.IncomingMessage, user: PendingConnection) {
        this.pendingConnections.set(user.id, user)
        user.socket?.emit('data',user.userCode)
    }

    CheckUsers = async() => {
        try {
            const userIdsToCheck: string[] = []
            const pendingData = new Map<string, PendingConnection>()
            const connections: PendingConnection[] = Object.values(this.pendingConnections)
            for (const connection of connections) {
                await connection.reload()
                if (Date.now() - connection.lastCheck > SOCKET_TIMEOUT_SECONDS * 1000) {
                    this.pendingConnections.delete(connection.id)
                    connection.socket?.destroy()
                    connection.remove()
                    continue
                }
                if (connection.resolvedProvider && connection.resolvedUserId) {
                    pendingData.set(connection.resolvedUserId, connection)
                }
                if (userIdsToCheck.length >= 100) break //stop processing as we have 100+ users this cycle and twitch only allows us to grab 100 at once
            }

            const userDatas = await getUsersById(userIdsToCheck)
            if (!userDatas) return
            for (const userData of userDatas) {
                const connection = pendingData.get(userData.id)
                if (!connection) continue
                const accessToken = createAccessToken(userData)
                const refreshToken = createRefreshToken(userData)
                connection.socket?.emit('data',JSON.stringify({
                    tokens: {
                        access: accessToken,
                        refresh: refreshToken,
                        expiresIn: 28800
                    }
                }))
                connection.socket?.destroy()
                this.pendingConnections.delete(connection.id)
                connection.remove()
            }
        } catch (e) {
            console.error(e)
        }
        this.timeout = setTimeout(()=>this.CheckUsers(), 5000)
    }
}

class PendingOutboundAccessTokens{
    connection: PendingConnection
    socket: stream.Duplex
    sub: string
    userData?: TwitchUserData
    access_token?: string
    refresh_token?: string
    constructor(socket: stream.Duplex, sub: string, connection: PendingConnection) {
        this.socket = socket
        this.sub = sub
        this.connection = connection
    }

    async generateTokensAndCloseSocket(userData: TwitchUserData){
        this.access_token = createAccessToken(userData)
        this.refresh_token = createRefreshToken(userData)
    }
}

const AuthSocket = new AuthWebsocket()

export default AuthSocket
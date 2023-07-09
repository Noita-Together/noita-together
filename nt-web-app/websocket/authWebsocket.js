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
    server
    pendingConnections
    userRepository
    pendingConnectionRepository
    timeout

    constructor() {
        this.server = new WebSocket.Server({noServer: true, perMessageDeflate: false})
        this.pendingConnections = {}
        PendingConnectionDatasource()
            .then((db) => this.pendingConnectionRepository = db?.getRepository(PendingConnection))
        UserDatasource()
            .then((db) => this.userRepository = db?.getRepository(User))

        this.timeout = setTimeout(()=>this.CheckUsers(), 5000)

        this.server.on(
            "connection",
            (
                socket,
                req,
                user
            ) => this.OnConnection(socket, req, user)
        )
    }

    async OnConnection(ws, req, user) {
        let connection = new Connection(ws, req, user)
        this.pendingConnections[user.id] = connection
        connection.send(user.userCode)
    }

    CheckUsers = async() => {
        console.log('Check Users :)')
        await this.DoCheckUsers().catch((e)=>{
            console.log('DoCheckUsers failed this run :(')
            console.error(e)
        })
        console.log('Checked users')
        this.timeout = setTimeout(()=>this.CheckUsers(), 5000)
    }

    DoCheckUsers = async() => {
        const userIdsToCheck = []
        const pendingData = {}
        const connections = Object.values(this.pendingConnections)
        console.log(`DoCheck ${connections.length} Users`)
        for (const connection of connections) {
            let user = connection.user
            await user.reload()
            console.log(`DoCheck Resolved? ${user.resolvedUserId}`)
            if (Date.now() - user.lastCheck > SOCKET_TIMEOUT_SECONDS * 1000) {
                delete this.pendingConnections[user.id]
                user.socket?.destroy()
                user.remove()
                continue
            }
            if (user.resolvedProvider && user.resolvedUserId) {
                pendingData[user.resolvedUserId] = connection
                userIdsToCheck.push(user.resolvedUserId)
            }
            if (userIdsToCheck.length >= 100) break //stop processing as we have 100+ users this cycle and twitch only allows us to grab 100 at once
        }

        if(userIdsToCheck.length === 0) return
        console.log(`GetUsersById: ${userIdsToCheck.length} users`)
        const userDatas = await getUsersById(userIdsToCheck)
        if (!userDatas){
            console.log(`GetUsersById: Returned null :(`)
            return
        }
        console.log(`GetUsersById: Fetched ${userDatas.length} users`)
        for (const userData of userDatas) {
            const connection = pendingData[userData.id]
            if (!connection) continue
            const accessToken = createAccessToken(userData)
            const refreshToken = createRefreshToken(userData)
            connection.send(JSON.stringify({
                tokens: {
                    access: accessToken,
                    refresh: refreshToken,
                    expiresIn: 28800
                }
            }))
            connection.user.socket?.destroy()
            delete this.pendingConnections[connection.user.id]
            connection.user.remove()
        }
    }
}

class Connection{
    ws
    req
    user
    constructor(ws, req, user) {
        this.ws = ws
        this.req = req
        this.user = user
    }

    send(data){
        this.ws.send(data)
    }
}

const AuthSocket = new AuthWebsocket()

export default AuthSocket
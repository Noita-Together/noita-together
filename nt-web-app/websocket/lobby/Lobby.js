"use strict";

import {StatsController} from "../stats/StatsController";
import StatsInterface from "../stats/StatsInterface";
import WebSocket from "ws";
import * as fs from "fs"

import {MakeFrame} from "./LobbyUtils"
import {User} from "./User"
import {Room} from "./Room"
import {encodeLobbyMsg} from "../messageHandler";

import {v4 as uuidv4} from "uuid";

import validator from "validator";

const THRESHOLD = 1024 * 16

const allowed_dev_users = fs.readFileSync('.uaccess', 'utf-8').replace(/[\n\r]/g, '\n').split('\n').filter(a => a.endsWith(':dev'))
console.log(`Loaded allowed dev users: ${JSON.stringify(allowed_dev_users, undefined, 2)}`)

class Lobby {
    /**
     * @type {StatsInterface|undefined}
     */
    statsController;
    constructor(statsController = undefined, initStatsController=true) {
        this.server = new WebSocket.Server({ noServer: true, perMessageDeflate: false })
        this.users = new Map()
        this.rooms = new Map()
        if(!statsController && initStatsController){
            StatsController.create().then((controller)=>this.statsController = controller)
        }

        this.server.on("connection", (socket, req, user) => this.OnConnection(socket, req, user))
        this.pinger = setInterval(() => {
            this.CheckUsers()
        }, 30000)
    }

    /**
     *
     * @param role {'host','play','spectate'}
     * @param user {User}
     * @constructor
     */
    CanUserAccess(role, user){
        return true //TODO
    }

    CheckUsers() {
        this.users.forEach(user => {
            if (!user.isAlive) {
                user.Disconnect()
                return
            }
            user.HealthCheck()
        })
    }

    OnConnection(socket, req, user) {
        console.log('OnConnection', user)
        const id = user.id
        const name = user.display_name
        const uaccess = user.uaccess || 0
        this.AddUser(id, name, uaccess, socket, this)
    }

    HandleAction(action, user) {
        try {
            const key = Object.keys(action).shift()
            const payload = action[key]
            if (typeof this[key] === "function") {
                this[key](payload, user)
            }
        } catch (error) {
            console.log(error.stack)
        }
    }

    Announce(message) {
        this.rooms.forEach(room => {
            room.SysMsg(message, true)
        })

    }

    BroadcastTo(data, to, ignoreId) {
        const list = MakeFrame(data)

        this.users.forEach(user => {
            if (to.indexOf(user.id) === -1 || ignoreId) { return }
            user.Write(list)
        })
    }

    Broadcast(data) {
        const list = MakeFrame(data)

        for (const [userId, user] of this.users) {
            if (user.inRoom) { continue }
            user.Write(list)
        }
    }

    BroadcastAll(data) {
        const list = MakeFrame(data)

        for (const [userId, user] of this.users) {
            user.Write(list)
        }
    }

    DeleteRoom(id) {
        this.rooms.delete(id)
    }

    AddUser(id, name, uaccess, socket, lobby) {
        const user = this.users.get(id)
        if (typeof user !== "undefined") {
            user.onDisconnect()
            this.users.set(id, new User(id, name, uaccess, socket, lobby))
        }
        else {
            this.users.set(id, new User(id, name, uaccess, socket, lobby))
        }
    }

    DeleteUser(user) {
        this.users.delete(user.id)
    }

    cRoomCreate(payload, user) {
        if (process.env.DEV_MODE === 'true' && user.uaccess < 3) {
            console.log(`cRoomCreate : devMode : user denied room creation as access level is ${user.uaccess}`)
            const msg = encodeLobbyMsg("sRoomCreateFailed", { reason: "Room creation is disabled at the moment, Server is in dev mode :)" })
            user.Send(msg)
            return
        }

        for (const [roomId, room] of this.rooms) {
            if (room.owner.id === user.id) {
                room.Delete()
            }
        }

        if (user.inRoom) {
            const msg = encodeLobbyMsg("sRoomCreateFailed", { reason: "Already in a room." })
            user.Send(msg)
            return
        }
        const { name, password, gamemode, maxUsers, locked } = payload
        if (user.uaccess > 0 && !name.trim() || !validator.isAscii(name.trim())) {
            const msg = encodeLobbyMsg("sRoomCreateFailed", { reason: "Invalid room name." })
            user.Send(msg)
            return
        }
        const pwd = password && validator.isAscii(password)

        const room = new Room(uuidv4(), name, pwd ? password : "", user, maxUsers, gamemode, !!locked, this, this.statsController)
        this.rooms.set(room.id, room)
        user.room = room
        const msg = encodeLobbyMsg("sRoomCreated", {
            id: room.id,
            name: room.name,
            gamemode: room.gamemode,
            password: room.password,
            locked: room.locked,
            maxUsers: room.maxUsers,
            users: [{ userId: user.id, name: user.name, ready: false, owner: true }]
        })
        user.Send(msg)
        const lobbyMsg = encodeLobbyMsg("sRoomAddToList", {
            room: {
                id: room.id,
                name: room.name,
                gamemode: room.gamemode,
                curUsers: 1,
                protected: !!room.password,
                owner: user.name,
                maxUsers: room.maxUsers,
                locked: room.locked
            }
        })
        this.Broadcast(lobbyMsg)
    }
    cRoomDelete(payload, user) {
        if (!user.inRoom) { return }
        const room = user.room
        if (room.owner.id !== user.id) { return }
        this.rooms.delete(room.id)
        if(room.session_id) this.statsController?.completeSession(room.session_id)
        room.Delete()
    }

    cRoomUpdate(payload, user) {
        if (!user.inRoom) { return }
        const room = user.room
        if (room.owner.id !== user.id) {
            const msg = encodeLobbyMsg("sRoomUpdateFailed", { reason: "Can't do that." })
            user.Send(msg)
            return
        }

        const { name, gamemode, maxUsers, password, locked } = payload
        const updateMsg = {}
        if (name && name.trim() && validator.isAscii(name.trim())) {
            room.name = room.SanitizeRoomName(name.trim())
            updateMsg.name = room.name
        }
        else if (gamemode && typeof gamemode == "number") {
            room.gamemode = gamemode
            updateMsg.gamemode = gamemode
        }
        else if (maxUsers && typeof maxUsers == "number") {
            if (maxUsers > room.users.size) {
                room.maxUsers = room.SanitizeCapacity(maxUsers)
                updateMsg.maxUsers = room.maxUsers
            }
            else {
                const msg = encodeLobbyMsg("sRoomUpdateFailed", { reason: "Can't do that." })
                user.Send(msg)
                return
            }
        }
        else if (password && password.trim() && validator.isAscii(password.trim())) {
            room.password = password.trim()
        }
        else if (typeof locked != "undefined") {
            room.locked = locked
            updateMsg.locked = locked
        }
        else {
            const msg = encodeLobbyMsg("sRoomUpdateFailed", { reason: "Can't do that." })
            user.Send(msg)
            return
        }
        const msg = encodeLobbyMsg("sRoomUpdated", updateMsg)
        room.Broadcast(msg)
    }

    cRoomFlagsUpdate(payload, user) {
        if (!user.inRoom) { return }
        const room = user.room
        if (room.owner.id !== user.id) {
            const msg = encodeLobbyMsg("sRoomFlagsUpdateFailed", { reason: "Can't do that." })
            user.Send(msg)
            return
        }
        room.UpdateFlags(payload)
    }

    cJoinRoom(payload, user) {
        const room = this.rooms.get(payload.id)
        if (!room) {
            const msg = encodeLobbyMsg("sJoinRoomFailed", { reason: "Room doesn't exist." })
            user.Send(msg)
            return
        }
        if (user.inRoom) {
            const msg = encodeLobbyMsg("sJoinRoomFailed", { reason: "Already in a room." })
            user.Send(msg)
            return
        }
        if (room.locked) {
            const msg = encodeLobbyMsg("sJoinRoomFailed", { reason: "Room is locked." })
            user.Send(msg)
            return
        }
        if (room.password && room.password != payload.password) {
            const msg = encodeLobbyMsg("sJoinRoomFailed", { reason: "Bad password." })
            user.Send(msg)
            return
        }
        if (room.blacklist.indexOf(user.id) > -1) {
            const msg = encodeLobbyMsg("sJoinRoomFailed", { reason: "Banned from this room." })
            user.Send(msg)
            return
        }
        if (room.users.size == room.maxUsers) {
            const msg = encodeLobbyMsg("sJoinRoomFailed", { reason: "Room is full." })
            user.Send(msg)
            return
        }
        room.UserJoin(user)

    }

    cLeaveRoom(payload, user) {
        const room = user.room
        if (!room) { return } //TODO Error ?

        user.Leave()
    }

    cKickUser(payload, user) {
        const room = user.room
        if (!room) { return } //TODO Error ?
        if (room.owner.id !== user.id) { return } //TODO Error?
        const kickUser = room.users.get(payload.userId)
        if (kickUser) {
            console.log(`kick/ban ${kickUser.name}`)
            kickUser.Leave({ isKick: true })
        }
    }

    cBanUser(payload, user) {
        const room = user.room
        if (!room) { return } //TODO Error ?
        if (room.owner.id !== user.id) { return } //TODO Error?

        const kickUser = room.users.get(payload.userId)
        if (kickUser) {
            console.log(`kick/ban ${kickUser.name}`)
            kickUser.Leave({ isBan: true })
        }
    }

    cReadyState(payload, user) {
        const room = user.room
        if (!room) { return } //TODO Error ?
        room.UserReady(payload, user)
    }

    cStartRun(payload, user) {
        const room = user.room
        if (!room) { return } //TODO Error ?
        if (room.owner.id !== user.id) { return } //TODO Error?
        room.StartRun(payload)
    }

    cRequestRoomList(payload, user) {
        const list = []
        this.rooms.forEach(room => {
            if (!room) { return }
            if (!room.owner) { return }
            list.push({
                id: room.id,
                name: room.name,
                gamemode: room.gamemode,
                curUsers: room.users.size,
                maxUsers: room.maxUsers,
                protected: !!room.password,
                locked: room.locked,
                owner: room.owner.name
            })
        })

        const pages = 0//Math.ceil(this.rooms.size / 50)
        const msg = encodeLobbyMsg("sRoomList", { rooms: list, pages })
        user.Send(msg)
    }

    cRunOver(payload, user) {
        const room = user.room
        if (!room) { return }
        if (!room.inProgress) { return }
        if (room.owner.id !== user.id) { return }

        room.FinishRun()
    }
}

const lobby = new Lobby(undefined, false)
export default lobby
'use-strict'
const uuidv4 = require("uuid").v4
const validator = require("validator")
const { decode, encodeGameMsg, encodeLobbyMsg } = require("./handlers/messageHandler")
const { setStats } = require("./controllers/statsController.js")
const WebSocket = require("ws")
const THRESHOLD = 1024 * 16
function MakeFrame(data) {
    let readOnly = true
    let buf = null
    if (data instanceof ArrayBuffer) {
        buf = Buffer.from(data)
    } else if (ArrayBuffer.isView(data)) {
        buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength)
    } else {
        buf = Buffer.from(data)
        readOnly = false
    }
    const list = WebSocket.Sender.frame(buf, {
        readOnly,
        mask: false,
        rsv1: false,
        opcode: 2,
        fin: true
    })
    return list
}
function noop() { }
class User {
    constructor(id, name, uaccess, socket, lobby) {
        this.isAlive = true
        this.rateLimit = 0
        this.position = { x: 0, y: 0 }
        this.ready = false
        this.cacheReady = null
        this.modCheck = null
        this.id = id
        this.name = name
        this.uaccess = uaccess
        this.socket = socket
        this.room = null
        this.lobby = lobby
        this.wsQueue = []
        /*
        this.deQueue = setInterval(() => {
            this.Queue()
        }, 1000)
        */
        this.socket.on("message", (msg) => this.OnMessage(msg))
        this.socket.on("pong", () => this.OnPong())
        this.socket.on("close", (code, reason) => this.OnClose(code, reason))
        this.socket.on("error", (error) => this.OnError(error))
    }

    get inRoom() {
        return this.room !== null
    }

    Send(data) {
        this.socket.send(data)
    }

    Write(data, allowQueue) {
        /*
        if (allowQueue && this.socket.bufferedAmount > THRESHOLD) {
            this.wsQueue.push(data)
            console.log("throttle this bitch")
            return
        }
        */
        this.socket._sender.sendFrame(data)//why no worky reee
    }
    /*
    Queue() {
        if (this.socket.bufferedAmount > THRESHOLD) { return }
        if (this.wsQueue.length > 15) { this.wsQueue = [] }
        for (const msg of this.wsQueue) {
            this.Write(msg, true)
        }
        this.wsQueue = [] //deletes any msgs queued up by above
    }
    */
    Leave(reason = { isKick: false, isBan: false, isDisconnect: false }) {
        this.room.UserLeave(this, reason)
        this.position = { x: 0, y: 0 }
        this.cacheReady = null
        this.modCheck = null
        this.room = null
    }

    FinishRun() {
        this.modCheck = null
        this.cacheReady = null
    }

    HealthCheck() {
        this.isAlive = false
        this.rateLimit = 0
        this.socket.ping(noop)
    }

    OnMessage(data) {
        try {
            this.isAlive = true
            if (this.rateLimit > 2000) {
                console.log(`[USER-${this.id}-${this.rateLimit}]${this.name} is being rate limited`)
                return
            }
            this.rateLimit = this.rateLimit + 1
            const clientMsg = decode(data)
            if (!clientMsg) {
                //TODO Error ?
                return
            }

            const { gameAction, lobbyAction } = clientMsg
            if (gameAction && this.room !== null) {
                this.room.HandleAction(gameAction, this)
            }
            else if (lobbyAction) {
                this.lobby.HandleAction(lobbyAction, this)
            }
        } catch (error) {
            console.error(error.stack)
        }
    }

    OnPong() {
        this.isAlive = true
    }

    OnClose(code, reason) {
        /*
        console.log(`[CLOSED-${code}]: ${reason}`)
        if (code === 1000) { //Normal disconnection

        }
        else if (code === 1006) { //Abnormal (app close / rip connection)

        }
        */
        this.Disconnect()
    }

    OnError(error) {
        console.log(error)
        console.log(error.stack)
    }

    Disconnect() {
        if (this.inRoom) {
            this.Leave({ isDisconnect: true })
        }
        this.lobby.DeleteUser(this)
        this.socket.terminate()
    }
}

class Room {
    constructor(id, name, password, owner, maxUsers, gamemode, locked, lobby) {
        this.id = id
        this.password = password
        this.owner = owner
        this.name = this.SanitizeRoomName(name)
        this.maxUsers = this.SanitizeCapacity(maxUsers)
        this.gamemode = gamemode
        this.locked = locked
        this.lobby = lobby
        this.blacklist = []
        this.inProgress = false
        this.flags = []
        this.flagsCache = null
        this.users = new Map()
        this.users.set(owner.id, owner)

        this.stats = null
        this.ResetStats()
        this.users.forEach(user => {
            this.ResetUserStats(user)
        })
    }

    SanitizeCapacity(cap) {
        const remain = cap % 5
        if (this.owner.uaccess > 1 && cap > 0 && cap <= 90 && remain === 0) {
            return cap
        }
        else if (cap > 0 && cap <= 30 && remain === 0) {
            return cap
        }
        else {
            return 5
        }
    }

    SanitizeRoomName(name) {
        if (this.owner.uaccess > 0) { return name.trim() }
        else {
            return `${this.owner.name}'s room`
        }
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

    BroadcastTo(data, to, ignoreId) {
        const list = MakeFrame(data)
        this.users.forEach(user => {
            if (to.indexOf(user.id) === -1 || user.id === ignoreId) { return }
            user.Write(list)
        })
    }

    Broadcast(data, ignoreId) {//
        const list = MakeFrame(data)

        this.users.forEach(user => {
            if (user.id === ignoreId) { return }
            user.Write(list)
        })
    }

    SysMsg(message, announcement) {
        const name = announcement ? "[ANNOUNCEMENT]" : "[SYSTEM]"
        const msg = encodeGameMsg("sChat", { id: uuidv4(), userId: "-1", name, message })
        this.Broadcast(msg)
    }

    UpdateFlags(payload) {
        const msg = encodeLobbyMsg("sRoomFlagsUpdated", payload)
        this.flags = payload.flags
        this.flagsCache = msg
        this.Broadcast(msg)
    }

    StartRun() {
        this.inProgress = true
        const msg = encodeLobbyMsg("sHostStart", { forced: false })
        this.Broadcast(msg)
    }

    FinishRun() {
        this.inProgress = false
        this.users.forEach(u => {
            u.FinishRun()
        })

        if (this.gamemode === 0) {//Coop
            setStats(this.id, this.stats)
            this.SysMsg(`Stats for the run: https://DOMAIN/stats/room/${this.id} (WIP feature)`)//TODO use run id instead of room id
        }
        else {
            this.SysMsg("Run over [Insert run stats here soon™]")
        }
        this.ResetStats()
        this.users.forEach(user => {
            this.ResetUserStats(user)
        })
    }

    ResetStats() {
        if (this.gamemode === 0) {//Coop
            this.stats = {
                roomName: this.name,
                users: {}, // id: {name: string, id: string, orbs: number, hearts: number, deaths: number, deposits: {}, withdraws: {}, steve: bool, left: bool}
                deposits: {
                    spells: {},
                    wands: {},
                    items: {}
                }
            }
        }
    }

    ResetUserStats(user) {
        if (this.gamemode === 0) {//Coop
            // id: {name: string, id: string, orbs: number, hearts: number, deaths: number, deposits: {}, withdraws: {}, steve: bool, left: bool}
            this.stats.users[user.id] = {
                name: user.name,
                id: user.id,
                hearts: 0,
                orbs: 0,
                deaths: 0,
                steve: false,
                left: false
            }

        }

    }

    UserJoin(user) {
        const msg = encodeLobbyMsg("sUserJoinedRoom", { userId: user.id, name: user.name })
        this.Broadcast(msg)
        this.users.set(user.id, user)
        user.room = this

        const users = []
        this.users.forEach(u => {
            users.push({ userId: u.id, name: u.name, ready: u.ready, owner: u.id === this.owner.id })
        })

        user.Send(encodeLobbyMsg("sJoinRoomSuccess", {
            id: this.id,
            name: this.name,
            gamemode: this.gamemode,
            password: this.password,
            locked: this.locked,
            maxUsers: this.maxUsers,
            users
        }))
        if (this.flagsCache !== null) {
            user.Send(this.flagsCache)
        }

        for (const [userId, u] of this.users) {
            if (u.cacheReady !== null) {
                user.Send(u.cacheReady)
            }
        }

        if (typeof this.stats.users[user.id] === "undefined") {
            this.ResetUserStats(user)
        }
        else {
            this.stats.users[user.id].left = false
        }

    }

    UserLeave(user, reason) {
        if (this.owner.id === user.id) {
            this.Delete(true)
            return
        }
        const msg = encodeLobbyMsg("sUserLeftRoom", { userId: user.id })
        this.Broadcast(msg)
        this.users.delete(user.id)

        if (reason.isDisconnect) {
            this.SysMsg(`${user.name} disconnected.`)
        }
        else if (reason.isBan) {
            this.blacklist.push(user.id)
            const confirmation = encodeLobbyMsg("sUserBanned", { userId: user.id })
            this.owner.Send(confirmation)
            this.SysMsg(`${user.name} has been banned from this room.`)
        }
        else if (reason.isKick) {
            const confirmation = encodeLobbyMsg("sUserKicked", { userId: user.id })
            this.owner.Send(confirmation)
            this.SysMsg(`${user.name} has been kicked from this room.`)
        }
        else {
            this.SysMsg(`${user.name} has left.`)
        }

        if (this.gamemode === 0) {//Coop
            this.stats.users[user.id].left = true
        }
    }

    UserReady(payload, user) {
        if (this.inProgress) {
            const oldReady = user.ready
            const newReady = payload.ready
            if (!oldReady && newReady && user.modCheck !== null) {
                const msg = encodeLobbyMsg("sUserReadyState", { userId: user.id, ...payload })
                if (JSON.stringify(msg) === JSON.stringify(user.modCheck)) {
                    this.Broadcast(msg)
                    user.Send(encodeLobbyMsg("sHostStart", { forced: false }))

                    user.ready = payload.ready
                    user.cacheReady = msg
                    return
                }
                else {
                    user.modCheck = null
                }
            }
            else if (oldReady && !newReady && user.modCheck === null) {
                user.modCheck = user.cacheReady
            }
        }
        const msg = encodeLobbyMsg("sUserReadyState", { userId: user.id, ...payload })
        user.ready = payload.ready
        user.cacheReady = msg
        this.Broadcast(msg)
    }

    Delete(ownerDisconnected) {
        const msg = encodeLobbyMsg("sRoomDeleted", { id: this.id })
        this.Broadcast(msg, ownerDisconnected ? this.owner.id : "")
        this.owner = null
        this.users.forEach(user => {
            user.room = null
        })
        this.lobby.DeleteRoom(this.id)
    }

    Rebroadcast(serverKey, payload, user, options = { ignoreSelf: false, ownerOnly: false, toHost: false }) {
        if (options.ownerOnly && this.owner.id !== user.id) { return }
        const msg = encodeGameMsg(serverKey, { userId: user.id, ...payload })

        if (options.toHost) {
            this.owner.Send(msg)
            return
        }
        else if (options.ignoreSelf) {
            this.Broadcast(msg, user.id)
            return
        }
        else {
            this.Broadcast(msg)
            return
        }
    }

    cPlayerMove(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        if (payload.frames.length === 0) { return }
        const last = payload.frames[payload.frames.length - 1]
        if (last) {
            user.position.x = last.x
            user.position.y = last.y
        }
        const small = encodeGameMsg("sPlayerPos", { userId: user.id, x: user.position.x, y: user.position.y })
        const big = encodeGameMsg("sPlayerMove", { userId: user.id, ...payload })
        const sendSmallTo = []
        const sendBigTo = []
        const { position } = user
        for (const [userId, u] of this.users) {
            const x = u.position.x - position.x
            const y = u.position.y - position.y
            const dist = Math.sqrt(x * x + y * y)
            if (dist < 400) {
                sendBigTo.push(userId)
            }
            else {
                sendSmallTo.push(userId)
            }
        }

        this.BroadcastTo(small, sendSmallTo, user.id)
        this.BroadcastTo(big, sendBigTo, user.id)
    }

    cPlayerUpdate(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        this.Rebroadcast("sPlayerUpdate", payload, user, { ignoreSelf: true })
    }

    cPlayerUpdateInventory(payload, user) { //TODO Implement
        if (!this.inProgress) { return }
    }

    cHostItemBank(payload, user) { //TODO split to multiple messages
        if (!this.inProgress) { return } //TODO Error? run not started yet
        this.Rebroadcast("sHostItemBank", payload, user, { ownerOnly: true })
    }

    cHostUserTake(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        this.Rebroadcast("sHostUserTake", payload, user, { ownerOnly: true })
    }

    cHostUserTakeGold(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        this.Rebroadcast("sHostUserTakeGold", payload, user, { ownerOnly: true })
    }

    cPlayerAddGold(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        this.Rebroadcast("sPlayerAddGold", payload, user)
    }

    cPlayerTakeGold(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        this.Rebroadcast("sPlayerTakeGold", payload, user, { toHost: true })
    }

    cPlayerAddItem(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        this.Rebroadcast("sPlayerAddItem", payload, user)
    }

    cPlayerTakeItem(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        this.Rebroadcast("sPlayerTakeItem", payload, user, { toHost: true })
    }

    cPlayerPickup(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        if (this.gamemode === 0) {//Coop
            if (payload.heart) {
                this.stats.users[user.id].hearts++
            }
            else if (payload.orb) {
                this.stats.users[user.id].orbs++
            }
        }
        this.Rebroadcast("sPlayerPickup", payload, user, { ignoreSelf: true })
    }

    cNemesisAbility(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        this.Rebroadcast("sNemesisAbility", payload, user, { ignoreSelf: true })
    }

    cNemesisPickupItem(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        this.Rebroadcast("sNemesisPickupItem", payload, user, { ignoreSelf: true })
    }

    cPlayerNewGamePlus(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        this.Rebroadcast("sPlayerNewGamePlus", payload, user, { ignoreSelf: true })
    }

    cPlayerSecretHourglass(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        this.Rebroadcast("sPlayerSecretHourglass", payload, user, { ignoreSelf: true })
    }

    cCustomModEvent(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        this.Rebroadcast("sCustomModEvent", payload, user, {
            ignoreSelf: payload.ignoreSelf,
            toHost: payload.toHost
        })
    }

    cCustomModHostEvent(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        if (this.owner.id !== user.id) { return } //TODO Error ?
        this.Rebroadcast("sCustomModHostEvent", payload, user, {
            ignoreSelf: payload.ignoreSelf,
            ownerOnly: true
        })
    }

    cAngerySteve(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        if (this.gamemode === 0) {//Coop
            this.stats.users[user.id].steve = true
        }
        this.Rebroadcast("sAngerySteve", payload, user, { ignoreSelf: true })
    }

    cRespawnPenalty(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        if (this.gamemode === 0) {//Coop
            this.stats.users[user.id].deaths++
        }
        this.Rebroadcast("sRespawnPenalty", payload, user, { ignoreSelf: true })
    }

    cPlayerDeath(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
        if (this.gamemode === 0) {//Coop
            this.stats.users[user.id].deaths++
        }
        this.Rebroadcast("sPlayerDeath", payload, user, { ignoreSelf: true })
    }

    cChat(payload, user) {
        this.Rebroadcast("sChat", { id: uuidv4(), name: user.name, ...payload }, user, { ignoreSelf: true })
    }

    cPlayerEmote(payload, user) {
        if (!this.inProgress) { return } //TODO Error? run not started yet
    } //TODO Implement
}

class Lobby {
    constructor() {
        this.server = new WebSocket.Server({ noServer: true, perMessageDeflate: false })
        this.users = new Map()
        this.rooms = new Map()


        this.server.on("connection", (socket, req, user) => this.OnConnection(socket, req, user))
        this.pinger = setInterval(() => {
            this.CheckUsers()
        }, 30000)
        this.canCreateRooms = true
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
        if (!this.canCreateRooms && user.name !== "Soler91") {
            const msg = encodeLobbyMsg("sRoomCreateFailed", { reason: "Room creation is disabled at the moment, usually due to the server about to go into maintenance." })
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
        const { name, password, gamemode, maxUsers } = payload
        if (user.uaccess > 0 && !name.trim() || !validator.isAscii(name.trim())) {
            const msg = encodeLobbyMsg("sRoomCreateFailed", { reason: "Invalid room name." })
            user.Send(msg)
            return
        }
        const pwd = password && validator.isAscii(password)

        const room = new Room(uuidv4(), name, pwd ? password : "", user, maxUsers, gamemode, false, this)
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
        if (name.trim() && validator.isAscii(name.trim())) {
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
        else if (password.trim() && validator.isAscii(password.trim())) {
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

module.exports = new Lobby()
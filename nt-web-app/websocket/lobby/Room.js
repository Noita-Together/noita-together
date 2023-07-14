import {MakeFrame} from "./LobbyUtils";
import {encodeGameMsg, encodeLobbyMsg} from "../messageHandler";

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
            // setStats(this.id, this.stats) //TODO re-enable
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

export{
    Room
}
const EventEmitter = require("events")
const path = require("path")
const ws = require("ws")
const { v4: uuidv4 } = require("uuid")
const appEvent = require("./appEvent")
const cmdLineArgs = require("./cmdLineArgs")
const { ipcMain } = require("electron")
const { NT } = require("@noita-together/nt-message")
const { decodeFrames } = require("./frameCoder")
function sysMsg(message) {
    appEvent("sChat", {
        id: uuidv4(),
        userId: "-1",
        name: "[SYSTEM]",
        message
    })
}

function lerp(a, b, weight) {
    return a * weight + b * (1 - weight)
}

function rotLerp(a, b, weight) {
    const pi2 = Math.PI * 2
    const shortest = ((a - b + Math.PI) % pi2) - Math.PI
    return b + ((shortest * weight) % pi2)
}

const distSquaredThreshold = 400 * 400

class NoitaGame extends EventEmitter {
    constructor() {
        super()
        this.setMaxListeners(0)
        this.port = 25569
        this.server = null

        this.client = null
        this.paused = false
        this.queue = []
        this.queueDelay = 5000

        this.rejectConnections = true
        this.user = { userId: 0, name: "", host: false }
        this.spellList = []
        this.gameFlags = []
        this.players = {}
        this.bank = {
            wands: [],
            spells: [],
            flasks: [],
            objects: [],
            gold: 0
        }
        this.onDeathKick = false
        this.lastX = 0
        this.lastY = 0
        ipcMain.once("game_listen", () => {
            this.gameListen()
        })
    }

    setLastPosition(x, y) {
        if (typeof x === "number" && typeof y === "number") {
            this.lastX = x
            this.lastY = y
        }
    }

    isConnectionLocalhost(ws) {
        const addr = ws._socket.remoteAddress
        return (
            addr == "::1" ||
            addr == "127.0.0.1" ||
            addr == "localhost" ||
            addr == "::ffff:127.0.0.1" ||
            cmdLineArgs.isAllowRemoteNoita()
        )
    }

    gameListen() {
        if (!this.server) {
            this.server = new ws.Server({ port: this.port })
        }
        this.server.on("connection", (socket) => {
            //console.log("[Game WS] New connection(?)")
            if (!this.isConnectionLocalhost(socket) || this.rejectConnections) {
                //console.log("terminate")
                socket.terminate()
                return
            }

            socket.on("message", (data) => {
                this.gameMessage(data, socket)
            })

            socket.on("close", () => {
                if (this.client === socket) {
                    //console.log("[Game] Disconnected.")
                    this.client = null
                    this.emit("GAME_CLOSE")
                }
            })
        })

        this.on("GameSpellList", (payload) => {
            this.setSpellList(payload)
        })
        this.on("RequestPlayerList", () => {
            this.sendPlayerList()
            this.sendEvt("UpdateFlags", this.gameFlags)
        })
        this.on("PlayerDeath", () => {
            this.bank = {
                wands: [],
                spells: [],
                flasks: [],
                objects: [],
                gold: 0
            }
        })
        this.on("RunOver", () => {
            this.bank = {
                wands: [],
                spells: [],
                flasks: [],
                objects: [],
                gold: 0
            }
        })
    }
    // event and ping
    // {event: "", payload: {}}
    gameMessage(data, socket) {
        let dataJSON = null
        if (data.slice(0, 1) == ">") {
            if (data == ">RES> [no value]") {
                return
            } else {
                //console.log(data)
                return
            }
        } else {
            try {
                dataJSON = JSON.parse(data)
            } catch (e) {
                console.log("[Game] Error parsing game message.")
                console.error(e)
                return
            }
        }
        if (dataJSON.event == "ping") {
            if (!this.client) {
                //console.log("[Game] Connected.")
                this.client = socket
                this.emit("GAME_OPEN")
                this.bankToGame()
            }
        } else {
            /*
            console.log({ dataJSON })
            console.log()
            */
            this.emit(dataJSON.event, dataJSON.payload)
        }
    }

    get isPaused() {
        return this.paused
    }

    get isHost() {
        return this.user.host
    }

    setUser(user) {
        this.user = user
    }

    setHost(val) {
        this.user.host = val
    }

    sendEvt(key, payload = {}) {
        this.toGame({ event: key, payload })
    }

    toGame(obj = {}) {
        if (!this.client) {
            //console.log("[Game] Pushed code to queue.")
            this.queue.push(obj)
            return
        }
        const evt = JSON.stringify(obj)
        this.client.send(evt)

        if (this.queue.length > 0) {
            setTimeout(() => {
                this.toGame(this.queue.shift())
            }, this.queueDelay)
        }
    }

    /** @param {NT.ServerRoomFlagsUpdated.GameFlag[]} toGameData */
    updateFlags(data) {
        // don't mutate the input!
        const toGameData = data.map((v) => ({ ...v }))

        // to avoid making changes to how the mod deals with flags, convert our pseudo-enum
        // ("NT_death_penalty", "end") into a boolean flag ("NT_death_penalty_end") before
        // sending to the mod
        const deathPenalty = toGameData.findIndex(
            (flag) => flag.flag === "NT_death_penalty"
        )
        if (deathPenalty > -1) {
            /** @type {NT.ServerRoomFlagsUpdated.GameFlag} */
            const flag = toGameData[deathPenalty]
            if (flag.strVal) {
                toGameData[deathPenalty] = {
                    flag: `${flag.flag}_${flag.strVal}`
                }
            }
        }

        const onDeathKick = toGameData.some(
            (entry) => entry.flag == "NT_ondeath_kick"
        )
        if (this.isHost) {
            this.onDeathKick = onDeathKick
            toGameData.push({ flag: "NT_is_host" })
        }

        toGameData.push({ flag: "NT_GAMEMODE_CO_OP" }) //hardcode this for now :) <3

        // store a copy in case the game asks for it
        this.gameFlags = toGameData.map((v) =>
            NT.ServerRoomFlagsUpdated.GameFlag.create(v)
        )
        this.sendEvt("UpdateFlags", this.gameFlags)
    }

    addPlayer(data) {
        this.players[data.userId] = data
        if (!this.client) {
            return
        }
        this.sendEvt("AddPlayer", data)
    }

    removePlayer(data) {
        delete this.players[data.userId]
        this.sendEvt("RemovePlayer", data)
    }

    bankToGame() {
        const bank = []
        for (const wand of this.bank.wands) {
            bank.push(wand)
        }
        for (const spell of this.bank.spells) {
            bank.push(spell)
        }
        for (const item of this.bank.flasks) {
            bank.push(item)
        }
        for (const item of this.bank.objects) {
            bank.push(item)
        }
        this.sendEvt("ItemBank", { items: bank, gold: this.bank.gold })
    }

    setSpellList(data) {}

    sendPlayerList() {
        for (let player in this.players) {
            this.sendEvt("AddPlayer", this.players[player])
        }
    }

    reset() {
        this.setHost(false)
        this.rejectConnections = true
        this.spellList = []
        this.gameFlags = []
        this.players = {}
        this.bank = {
            wands: [],
            spells: [],
            flasks: [],
            objects: [],
            gold: 0
        }
    }

    /**
     * @param {NT.ServerPlayerMoves} payload
     */
    sPlayerMoves(payload) {
        payload.userFrames.forEach(this.sPlayerMove, this)
    }

    /**
     * @param {NT.CompactPlayerFrames} payload
     */
    sPlayerMove(payload) {
        try {
            if (payload.userId == this.user.userId || !this.client) {
                return
            }

            // convert PlayerMove -> PlayerPosition when the player in question is too far
            // away from us. this saves client resources by not "replaying" the movements
            // of players we can't see
            const dist =
                (payload.xInit - this.lastX) ** 2 +
                (payload.yInit - this.lastY) ** 2
            if (!isNaN(dist) && dist > distSquaredThreshold) {
                const playerPos = {
                    userId: payload.userId,
                    x: payload.xInit,
                    y: payload.yInit
                }
                this.sendEvt("PlayerPos", playerPos)
                return
            }

            const decoded = decodeFrames(payload)
            // normal frame behavior instead
            const frames = []
            for (const [index, current] of decoded.entries()) {
                frames.push(current)
                const next = decoded[index + 1]
                if (typeof next !== "undefined") {
                    const med = {
                        x: lerp(current.x, next.x, 0.869),
                        y: lerp(current.y, next.y, 0.869),
                        armR: rotLerp(current.armR, next.armR, 0.869),
                        armScaleY: current.armScaleY,
                        scaleX: next.scaleX,
                        anim: next.anim,
                        held: next.held
                    }
                    frames.push(med)
                }
            }
            const jank = frames
                .map((current) => {
                    return `${current.armR},${current.armScaleY},${current.x},${current.y},${current.scaleX},${current.anim},${current.held},`
                })
                .join(",")
            this.sendEvt("PlayerMove", { userId: payload.userId, frames, jank })
        } catch (error) {
            console.log(error)
        }
    }
    // sPlayerPos(payload) {
    //     if (payload.userId == this.user.userId || !this.client) {
    //         return
    //     }
    //     this.sendEvt("PlayerPos", payload)
    // }
    sPlayerUpdate(payload) {
        if (payload.userId == this.user.userId) {
            return
        }
        this.sendEvt("PlayerUpdate", payload)
    }
    sPlayerUpdateInventory(payload) {
        if (payload.userId == this.user.userId) {
            return
        }
        this.sendEvt("PlayerUpdateInventory", payload)
    }
    sHostItemBank(payload) {
        this.bank = {
            wands: payload.wands,
            spells: payload.spells,
            flasks: payload.items,
            objects: payload.objects,
            gold: payload.gold
        }
        this.bankToGame()
    }
    sHostUserTake(payload) {
        if (!payload.success) {
            if (payload.userId == this.user.userId) {
                this.sendEvt("UserTakeFailed", payload)
            }
            return
        }
        for (const key in this.bank) {
            if (key == "gold") {
                continue
            }
            for (const [index, item] of this.bank[key].entries()) {
                if (item.id == payload.id) {
                    this.bank[key].splice(index, 1)
                    this.sendEvt("UserTakeSuccess", {
                        me: payload.userId == this.user.userId,
                        ...payload
                    })
                }
            }
        }
    }
    /**
     * @param {NT.ServerPlayerAddItem} message
     */
    sPlayerAddItem(message) {
        const pbjs = NT.ServerPlayerAddItem.create(message)

        const key = pbjs.item
        if (key == null) return

        const payload = pbjs[key]
        if (!payload) return

        const items = payload.list
        Array.prototype.push.apply(this.bank[key], items)
        this.sendEvt("UserAddItems", { userId: payload.userId, items }) //filter later?
    }
    sPlayerAddGold(payload) {
        this.bank.gold += payload.amount
        this.sendEvt("UserAddGold", payload)
    }
    sPlayerTakeGold(payload) {
        if (!this.isHost) {
            return
        }
        if (this.bank.gold >= payload.amount) {
            this.emit("HostTakeGold", {
                userId: payload.userId,
                amount: payload.amount,
                success: true
            })
        } else {
            this.emit("HostTakeGold", {
                userId: payload.userId,
                amount: payload.amount,
                success: false
            })
        }
    }
    sHostUserTakeGold(payload) {
        if (payload.success) {
            this.bank.gold -= payload.amount
            this.sendEvt("UserTakeGoldSuccess", {
                me: payload.userId == this.user.userId,
                ...payload
            })
        } else if (payload.userId == this.user.userId) {
            this.sendEvt("UserTakeGoldFailed", {
                me: payload.userId == this.user.userId,
                ...payload
            })
        }
    }
    sPlayerTakeItem(payload) {
        if (!this.isHost) {
            return
        }
        for (const key in this.bank) {
            if (key == "gold") {
                continue
            }
            for (const item of this.bank[key]) {
                if (item.id == payload.id) {
                    this.emit("HostTake", {
                        userId: payload.userId,
                        id: payload.id,
                        success: true
                    })
                    return
                }
            }
        }
        this.emit("HostTake", {
            userId: payload.userId,
            id: payload.id,
            success: false
        })
    }
    /**
     * @param {NT.ServerPlayerPickup} message
     */
    sPlayerPickup(message) {
        const pbjs = NT.ServerPlayerPickup.create(message)

        const player =
            message.userId == this.user.userId
                ? this.user
                : this.players[message.userId]
        const type = pbjs.kind
        if (type == null) return

        const payload = pbjs[type]
        if (!payload) return

        if (player) {
            sysMsg(`${player.name} picked up a ${type}.`)
        }
        if (message.userId == this.user.userId) {
            return
        }
        this.sendEvt("PlayerPickup", {
            userId: message.userId,
            [type]: payload
        })
    }
    sPlayerDeath(payload) {
        const player =
            payload.userId == this.user.userId
                ? this.user
                : this.players[payload.userId]
        if (player) {
            sysMsg(`${player.name} has ${payload.isWin ? "won" : "died"}.`)
            if (
                this.isHost &&
                this.onDeathKick &&
                !payload.isWin &&
                this.user.userId != payload.userId
            ) {
                this.emit("death_kick", payload.userId)
            }
        }
        if (payload.userId == this.user.userId) {
            return
        }
        this.sendEvt("PlayerDeath", payload)
    }
    //sPlayerNewGamePlus (payload) => {},
    sPlayerSecretHourglass(payload) {
        if (payload.userId == this.user.userId) {
            return
        }
        this.sendEvt("SecretHourglass", payload)
    }
    sCustomModEvent(payload) {
        if (payload.userId == this.user.userId) {
            return
        }
        try {
            this.sendEvt("CustomModEvent", {
                userId: payload.userId,
                ...JSON.parse(payload.payload)
            })
        } catch (error) {}
    }
    sRespawnPenalty(payload) {
        const player =
            payload.userId == this.user.userId
                ? this.user
                : this.players[payload.userId]
        if (player) {
            sysMsg(`${player.name} had to respawn against their will.`)
            if (
                this.isHost &&
                this.onDeathKick &&
                this.user.userId != payload.userId
            ) {
                this.emit("death_kick", payload.userId)
            }
        }
        if (payload.userId == this.user.userId) {
            return
        }
        this.sendEvt("RespawnPenalty", payload)
    }
    sAngerySteve(payload) {
        const player =
            payload.userId == this.user.userId
                ? this.user
                : this.players[payload.userId]
        if (player) {
            sysMsg(`${player.name} has angered the gods.`)
        }
        if (payload.userId == this.user.userId) {
            return
        }
        this.sendEvt("AngerySteve", payload)
    }
    /*
    sNemesisPickupItem (payload) => {},
    sNemesisAbility (payload) => {},
    */
    sChat(payload) {
        this.sendEvt("Chat", payload)
    }
}

module.exports = new NoitaGame()

const { v4: uuidv4 } = require("uuid")
const { ipcMain } = require("electron")
const ws = require("ws")
const {encodeLobbyMsg, encodeGameMsg, decode} = require("./handlers/messageHandler")
const appEvent = require("./appEvent")
const noita = require("./noita")

const host = (() => {
    const prefix = process.env.VUE_APP_LOBBY_SERVER_WS_URL_BASE || `wss://${process.env.VUE_APP_HOSTNAME_WS}` || 'wss://noitatogether.com/ws/'
    return prefix.endsWith('/') ? prefix : `${prefix}/`
})();

const print = true
module.exports = (data) => {
    const user = { userId: data.id, name: data.display_name }
    noita.setUser({ userId: user.userId, name: user.name, host: false })
    let isHost = false
    console.log(`Connect to lobby server ${host}`)
    let client = new ws(`${host}${data.token}`)
    
    const lobby = {
        sHostStart: (payload) => {
            if (isHost) {
                const msg = encodeGameMsg("cHostItemBank", {
                    wands: noita.bank.wands,
                    spells: noita.bank.spells,
                    items: noita.bank.flasks,
                    objects: noita.bank.objects,
                    gold: noita.bank.gold
                })
                sendMsg(msg)
            }
            noita.sendEvt("StartRun")

        },
        sUserBanned: (payload) => {
            if (payload.userId == user.userId) {
                noita.reset()
            }
            else {
                noita.removePlayer(payload)
            }
        },
        sUserKicked: (payload) => {
            if (payload.userId == user.userId) {
                noita.reset()
            }
            else {
                noita.removePlayer(payload)
            }
        },
        sUserLeftRoom: (payload) => {
            if (payload.userId == user.userId) {
                noita.reset()
            }
            else {
                noita.removePlayer(payload)
            }
        },
        sUserJoinedRoom: (payload) => {
            noita.addPlayer(payload)
        },
        sJoinRoomSuccess: (payload) => {
            noita.rejectConnections = false
            for (const player of payload.users) {
                if (player.userId == user.userId) { continue }
                noita.addPlayer({ userId: player.userId, name: player.name })
            }
        },
        sRoomFlagsUpdated: (payload) => {
            noita.updateFlags(payload.flags)
        },
        sRoomCreated: (payload) => {
            noita.rejectConnections = false
            noita.setHost(true)
            isHost = true
        },
        sRoomDeleted: (payload) => {
            noita.reset()
        },
    }

    client.on("open", () => {
        appEvent("CONNECTED", data)
    })

    client.on("close", () => {
        appEvent("CONNECTION_LOST")
        client.terminate()
        client = null
    })

    client.on("message", (data) => {
        try {
            const msg = decode(data)
            if (!msg) return;

            const actionType = msg.kind.case
            const action = msg.kind.value.action.case
            const payload = msg.kind.value.action.value

            if (!actionType || !action || !payload) {
                console.error(`Failed to decode message actionType=${actionType} action=${action} payload=${payload}`)
                return
            }

            switch (actionType) {
                case 'gameAction':
                    if (action === "sChat") { appEvent(action, payload) }
                    if (action === "sStatUpdate") { appEvent(action, payload) }
                    if (typeof noita[action] == "function") {
                        noita[action](payload)
                    }
                    break;
                case 'lobbyAction':
                    if (typeof lobby[action] == "function") { lobby[action](payload) }
                    appEvent(action, payload)
                    break;
                default:
                    console.log('Unknown Envelope case: '+msg.kind.case)
                    break;
            }
        } catch (error) {
            //eugh
            console.log(error)
        }
    })

    ipcMain.on("CLIENT_MESSAGE", (e, data) => {
        const msg = encodeLobbyMsg(data.key, data.payload)
        sendMsg(msg)
    })

    ipcMain.on("CLIENT_CHAT", (e, data) => {
        const msg = encodeGameMsg(data.key, data.payload)
        sendMsg(msg)
    })

    noita.on("death_kick", (userId) => {
        const msg = encodeLobbyMsg("cKickUser", { userId })
        sendMsg(msg)
    })

    noita.on("GAME_OPEN", () => {
        noita.sendEvt("RequestGameInfo")
        noita.sendEvt("RequestSpellList")

        noita.once("GameInfo", (event) => {
            const msg = encodeLobbyMsg("cReadyState", {
                ready: true,
                seed: event.seed,
                mods: event.mods,
                version: event.version,
                beta: event.beta
            })
            sendMsg(msg)
        })
    })

    noita.on("GAME_CLOSE", () => {
        unready()
    })

    noita.on("PlayerMove", (event) => {
        // don't send empty move updates. don't know why this happens...
        if (!event || !event.frames || event.frames.length === 0) return;
        
        if (event && event.frames && event.frames.length > 0) {
            const {x, y} = event.frames[event.frames.length-1];
            noita.setLastPosition(x, y);
        }
        const msg = encodeGameMsg("playerMove", event)
        sendMsg(msg)
    })

    noita.on("PlayerUpdate", (event) => {
        const msg = encodeGameMsg("cPlayerUpdate", event)
        sendMsg(msg)
    })

    noita.on("PlayerPickup", (event) => {
        /** @type {import('./gen/messages_pb').ClientPlayerPickup} */
        const payload = {}

        if (event.heart) {
            payload.case = 'heart'
            payload.value = event.heart
        }
        else if (event.orb) {
            payload.case = 'orb'
            payload.value = event.orb
        }

        const msg = encodeGameMsg("cPlayerPickup", { kind: payload })
        sendMsg(msg)
    })

    noita.on("PlayerDeath", (event) => {
        const msg = encodeGameMsg("cPlayerDeath", event)
        sendMsg(msg)
        unready()
    })

    noita.on("RunOver", () => {
        unready()
        if (isHost) {
            const msg = encodeLobbyMsg("cRunOver", { idk: false })
            sendMsg(msg)
        }
    })

    noita.on("SendGold", (event) => {
        const msg = encodeGameMsg("cPlayerAddGold", event)
        sendMsg(msg)
    })

    noita.on("TakeGold", (event) => {
        const msg = encodeGameMsg("cPlayerTakeGold", event)
        sendMsg(msg)
    })

    noita.on("AngerySteve", (event) => {
        const msg = encodeGameMsg("cAngerySteve", event)
        sendMsg(msg)
    })

    noita.on("RespawnPenalty", (event) => {
        const msg = encodeGameMsg("cRespawnPenalty", event)
        sendMsg(msg)
    })

    noita.on("SendItems", (event) => {
        /** @type {import('./gen/messages_pb').ClientPlayerAddItem} */
        const payload = {}

        if (event.spells) {
            payload.case = 'spells'
            payload.value = { list: event.spells.map(mapSpells) }
        }
        else if (event.flasks) {
            payload.case = 'flasks'
            payload.value = { list: event.flasks.map(mapFlasks) }
        }
        else if (event.wands) {
            payload.case = 'wands'
            payload.value = { list: event.wands.map(mapWands) }
        }
        else if (event.objects) {
            payload.case = 'objects'
            payload.value = { list: event.objects.map(mapObjects) }
        }
        const msg = encodeGameMsg("cPlayerAddItem", {item: payload})
        sendMsg(msg)
    })

    noita.on("PlayerTake", (event) => {
        const msg = encodeGameMsg("cPlayerTakeItem", event)
        sendMsg(msg)
    })

    noita.on("HostTake", (event) => {
        const msg = encodeGameMsg("cHostUserTake", event)
        sendMsg(msg)
    })

    noita.on("HostTakeGold", (event) => {
        const msg = encodeGameMsg("cHostUserTakeGold", event)
        sendMsg(msg)
    })

    noita.on("CustomModEvent", (event) => {
        const payload = JSON.stringify(event)
        const msg = encodeGameMsg("cCustomModEvent", { payload })
        sendMsg(msg)
    })

    function sendMsg(msg) {
        if (client != null) {
            client.send(msg)
        }
    }

    function unready() {
        const msg = encodeLobbyMsg("cReadyState", {
            ready: false,
            seed: "",
            mods: []
        })
        sendMsg(msg)
    }

    function mapWands(wand) {
        return {
            id: uuidv4(),
            stats: keysToCamel(wand.stats),
            alwaysCast: wand.always_cast ? wand.always_cast.map(mapSpells) : undefined,
            deck: wand.deck.map(mapSpells),
            sentBy: user.userId
        }
    }

    function mapSpells(spell) {
        return {
            id: uuidv4(),
            gameId: spell.id,
            usesRemaining: spell.usesRemaining,
            sentBy: user.userId
        }
    }

    function mapFlasks(val) {
        return {
            id: uuidv4(),
            isChest: val.isChest,
            color: {
                r: (val.color & 0xff) / 193,
                g: ((val.color >> 8) & 0xff) / 193.5,
                b: ((val.color >> 16) & 0xff) / 193
            },
            content: val.content,
            sentBy: user.userId
        }
    }

    function mapObjects(val) {
        return {
            id: uuidv4(),
            path: val.path,
            sprite: val.sprite,
            sentBy: user.userId
        }
    }

    function toCamel(str) {
        return str.replace(/([_][a-z])/ig, ($1) => {
            return $1.toUpperCase()
                .replace('_', '')
        })
    }

    function keysToCamel(obj) {
        const n = {}
        for (const key of Object.keys(obj)) {
            n[toCamel(key)] = obj[key]
        }
        return n
    }
}
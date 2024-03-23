const { v4: uuidv4 } = require("uuid")
const { ipcMain } = require("electron")
const appEvent = require("./appEvent")
const noita = require("./noita")
const { NT } = require("@noita-together/nt-message")
const { encodeFrames } = require("./frameCoder")
const { NTLobbyWebsocket } = require("./ws-ntlobby")
const Debug = require("debug")
const debug = Debug("nt:ws")

module.exports = (data) => {
    const user = { userId: data.id, name: data.display_name }
    noita.setUser({ userId: user.userId, name: user.name, host: false })
    let isHost = false

    const lobbySocket = new NTLobbyWebsocket(data.token)

    const lobby = {
        sHostStart: (payload) => {
            if (isHost) {
                lobbySocket.sendGameMsg("cHostItemBank", {
                    wands: noita.bank.wands,
                    spells: noita.bank.spells,
                    items: noita.bank.flasks,
                    objects: noita.bank.objects,
                    gold: noita.bank.gold
                })
            }
            noita.sendEvt("StartRun")
        },
        sUserBanned: (payload) => {
            if (payload.userId == user.userId) {
                noita.reset()
            } else {
                noita.removePlayer(payload)
            }
        },
        sUserKicked: (payload) => {
            if (payload.userId == user.userId) {
                noita.reset()
            } else {
                noita.removePlayer(payload)
            }
        },
        sUserLeftRoom: (payload) => {
            if (payload.userId == user.userId) {
                noita.reset()
            } else {
                noita.removePlayer(payload)
            }
        },
        sUserJoinedRoom: (payload) => {
            noita.addPlayer(payload)
        },
        sJoinRoomSuccess: (payload) => {
            noita.rejectConnections = false
            for (const player of payload.users) {
                if (player.userId == user.userId) {
                    continue
                }
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
        }
    }

    lobbySocket.on("open", () => {
        appEvent("CONNECTED", data)
    })

    lobbySocket.on("close", () => {
        appEvent("CONNECTION_LOST")
    })

    lobbySocket.on("reconnecting", () => {
        appEvent("RECONNECTING")
    })

    /**
     * @param {NT.GameAction} gameAction
     */
    function handleGameAction(gameAction) {
        const action = gameAction.action
        if (!action) return

        switch (action) {
            case "sChat":
            case "sStatUpdate":
                appEvent(action, gameAction[action])
                break
            default:
                if (typeof noita[action] === "function") {
                    noita[action](gameAction[action])
                } else {
                    console.error(`No handler for gameAction=${action}`)
                }
                break
        }
    }

    /**
     * @param {NT.LobbyAction} lobbyAction
     */
    function handleLobbyAction(lobbyAction) {
        const action = lobbyAction.action
        if (!action) return

        const payload = lobbyAction[action]
        if (!payload) return

        if (typeof lobby[action] == "function") {
            lobby[action](payload)
        }
        appEvent(action, payload)
    }

    lobbySocket.on("ntmessage", (msg) => {
        if (!msg) return

        const actionType = msg.kind
        switch (actionType) {
            case "gameAction":
                handleGameAction(msg.gameAction)
                break
            case "lobbyAction":
                handleLobbyAction(msg.lobbyAction)
                break
            default:
                console.error(`Unknown actionType=${actionType}`)
                break
        }
    })

    ipcMain.on("CLIENT_MESSAGE", (e, data) => {
        lobbySocket.sendLobbyMsg(data.key, data.payload)
    })

    ipcMain.on("CLIENT_CHAT", (e, data) => {
        lobbySocket.sendGameMsg(data.key, data.payload)
    })

    noita.on("death_kick", (userId) => {
        lobbySocket.sendLobbyMsg("cKickUser", { userId })
    })

    noita.on("GAME_OPEN", () => {
        noita.sendEvt("RequestGameInfo")
        noita.sendEvt("RequestSpellList")

        noita.once("GameInfo", (event) => {
            lobbySocket.sendLobbyMsg("cReadyState", {
                ready: true,
                seed: event.seed,
                mods: event.mods,
                version: event.version,
                beta: event.beta
            })
        })
    })

    noita.on("GAME_CLOSE", () => {
        unready()
    })

    noita.on("PlayerMove", (event) => {
        // don't send empty move updates. don't know why this happens...
        if (!event || !event.frames || event.frames.length === 0) return

        if (event && event.frames && event.frames.length > 0) {
            const { x, y } = event.frames[event.frames.length - 1]
            noita.setLastPosition(x, y)
        }
        const cf = encodeFrames(event.frames)
        lobbySocket.sendGameMsg("cPlayerMove", cf)
    })

    noita.on("PlayerUpdate", (event) => {
        lobbySocket.sendGameMsg("cPlayerUpdate", event)
    })

    noita.on("PlayerPickup", (event) => {
        lobbySocket.sendGameMsg("cPlayerPickup", event)
    })

    noita.on("PlayerDeath", (event) => {
        lobbySocket.sendGameMsg("cPlayerDeath", event)
        unready()
    })

    noita.on("RunOver", () => {
        unready()
        if (isHost) {
            lobbySocket.sendLobbyMsg("cRunOver", { idk: false })
        }
    })

    noita.on("SendGold", (event) => {
        lobbySocket.sendGameMsg("cPlayerAddGold", event)
    })

    noita.on("TakeGold", (event) => {
        lobbySocket.sendGameMsg("cPlayerTakeGold", event)
    })

    noita.on("AngerySteve", (event) => {
        lobbySocket.sendGameMsg("cAngerySteve", event)
    })

    noita.on("RespawnPenalty", (event) => {
        lobbySocket.sendGameMsg("cRespawnPenalty", event)
    })

    noita.on("SendItems", (event) => {
        /** @type {NT.ClientPlayerAddItem} */
        const msg = {}

        if (event.spells) {
            msg.spells = { list: event.spells.map(mapSpells) }
        } else if (event.flasks) {
            msg.flasks = { list: event.flasks.map(mapFlasks) }
        } else if (event.wands) {
            msg.wands = { list: event.wands.map(mapWands) }
        } else if (event.objects) {
            msg.objects = { list: event.objects.map(mapObjects) }
        }
        lobbySocket.sendMageMsg("cPlayerAddItem", msg)
    })

    noita.on("PlayerTake", (event) => {
        lobbySocket.sendGameMsg("cPlayerTakeItem", event)
    })

    noita.on("HostTake", (event) => {
        lobbySocket.sendGameMsg("cHostUserTake", event)
    })

    noita.on("HostTakeGold", (event) => {
        lobbySocket.sendGameMsg("cHostUserTakeGold", event)
    })

    noita.on("CustomModEvent", (event) => {
        const payload = JSON.stringify(event)
        lobbySocket.sendGameMsg("cCustomModEvent", { payload })
    })

    function unready() {
        lobbySocket.sendLobbyMsg("cReadyState", {
            ready: false,
            seed: "",
            mods: []
        })
    }

    function mapWands(wand) {
        return {
            id: uuidv4(),
            stats: keysToCamel(wand.stats),
            alwaysCast: wand.always_cast
                ? wand.always_cast.map(mapSpells)
                : undefined,
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
        return str.replace(/([_][a-z])/gi, ($1) => {
            return $1.toUpperCase().replace("_", "")
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

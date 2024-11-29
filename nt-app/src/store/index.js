import Vue from "vue"
import Vuex from "vuex"
import { ipcRenderer } from "electron"

/** @typedef {{'boolean': boolean, 'string': string, 'number': number}} VueFlagTypes */
/** @typedef {import('@noita-together/nt-message').NT.ClientRoomFlagsUpdate.IGameFlag} IGameFlag */

Vue.use(Vuex)
const randomColor = (name) => {
    var hash = 0
    for (var i = 0; i < name.length; i++) {
        hash = (hash << 5) - hash + name.charCodeAt(i)
    }
    var hue = Math.floor((hash / 100) * 360)
    return `hsl(${hue}, 70%, 60%)`
}
const firstOfType = (type, ...vs) => (vs || []).find((v) => typeof v === type)

/** @typedef {{ type: 'boolean', value: boolean, id: string }} BooleanFlag */
/** @typedef {{ type: 'string', value: string, id: string }} StringFlag */
/** @typedef {{ type: 'number', value: number, id: string }} NumberFlag */
/** @typedef {{ type: 'enum', value: string, choices: string[] }} EnumFlag */
/** @typedef {BooleanFlag|StringFlag|NumberFlag|EnumFlag} VueFlag */

export const gamemodes = {
    0: "Co-op",
    1: "Race",
    2: "Nemesis"
}
/** @typedef {keyof typeof gamemodes} GameMode */

// prettier-ignore
/** @typedef {{ name: string, tooltip: string }} FlagDescriptor */
/** @type {Record<number, Record<string, FlagDescriptor|Record<any, FlagDescriptor>>>} */
export const flagInfo = {
    0: {
        "NT_sync_perks":                  { name: "Share all perks", tooltip: "When grabbing perks the whole team will also get them." },
        "NT_team_perks":                  { name: "Team Perks", tooltip: "When grabbing certain perks (not all) the whole team will also get them." },
        "NT_alt_heartache":               { name: "Change Heartache", tooltip: "Change Heartache to affect HP instead of Max HP."},
        "NT_ban_perks":                   { name: "Ban Glass Cannon", tooltip: "Remove glass cannon from perk pool (Gamble is safe). Recommended for large lobbies when using Respawn Penalty."},
        "NT_sync_steve":                  { name: "Sync Steve", tooltip: "Angers the gods for everyone." },
        "NT_sync_hearts":                 { name: "Sync Hearts", tooltip: "When someone picks up a heart everyone else gets it too." },
        "NT_sync_orbs":                   { name: "Sync Orbs", tooltip: "When someone picks up an orb everyone else gets it too." },
        "NT_sync_orbs_no_curse":          { name: "Friendly PW Orbs", tooltip: "Parallel World orbs won't send cursed hearts to other players. No effect without \"Sync Orbs\"" },
        "NT_sync_orb_count":              { name: "Sync Orb Until", tooltip: "Everyone gets an orb until this number is hit. If 0, then there is no limit" },
        "NT_sync_shift":                  { name: "Sync Shifts", tooltip: "When someone fungal shifts everyone also gets the same shift, cooldown also applies." },
        "NT_send_wands":                  { name: "Send Wands", tooltip: "Allow players to deposit/take wands." },
        "NT_send_flasks":                 { name: "Send Flasks", tooltip: "Allow players to deposit/take flasks." },
        "NT_send_gold":                   { name: "Send Gold", tooltip: "Allow players to deposit/take gold." },
        "NT_send_items":                  { name: "Send Items", tooltip: "Allow players to deposit/take items." },
        "NT_world_randomize_loot":        { name: "Randomize loot", tooltip: "Only applies when playing on the same seed, makes it so everyone gets different loot." },
        "NT_sync_world_seed":             { name: "Sync Seed", tooltip: "All players play in the same world seed (requires everyone to start a new game) 0 means random seed." },
        "NT_death_penalty": {
            "end":           { name: "End run", tooltip: "Run ends for all players when someone dies." },
            "weak_respawn":  { name: "Respawn Penalty", tooltip: "Player respawns and everyone takes a % drop on their max hp, once it goes below certain threshold on the weakest player the run ends for everyone." },
            "full_respawn":  { name: "Respawn", tooltip: "Player will respawn on their last checkpoint and no penalties." },
        },
        "NT_ondeath_kick":                { name: "Kick on death", tooltip: "Kicks whoever dies, more customisable soon™. "},
    },
    2: {
        "NT_NEMESIS_ban_ambrosia":        { name: "Ban Ambrosia", tooltip: "will shift ambrosia away." },
        "NT_NEMESIS_ban_invis":           { name: "Ban Invisibility", tooltip: "will shift invisibility away and remove the perk." },
        "NT_NEMESIS_nemesis_abilities":   { name: "Nemesis abilities", tooltip: "Abilities will appear in each holy mountain with an NP cost." },
        "NT_sync_steve":                  { name: "Sync Steve", tooltip: "Angers the gods for everyone." },
        "NT_sync_orbs":                   { name: "Sync Orbs", tooltip: "When someone picks up an orb everyone else gets it too." },
        "NT_sync_orbs_no_curse":          { name: "Friendly PW Orbs", tooltip: "Parallel World orbs won't send cursed hearts to other players. No effect without \"Sync Orbs\"" },
        "NT_sync_orb_count":              { name: "Sync Orb Until", tooltip: "Everyone gets an orb until this number is hit. If 0, then there is no limit" },
        "NT_world_randomize_loot":        { name: "Randomize loot", tooltip: "Only applies when playing on the same seed, makes it so everyone gets different loot." },
        "NT_sync_world_seed":             { name: "Sync Seed", tooltip: "All players play in the same world seed (requires everyone to start a new game) 0 means random seed." },
        "NT_death_penalty": {
            "weak_respawn":  { name: "Last noita standing.", tooltip: "Run ends when there's only one player left." },
        },
        "NT_ondeath_kick":                { name: "Kick on death", tooltip: "Kicks whoever dies, more customisable soon™. "}
    },
};

// prettier-ignore
export const defaultFlags = {
    /** @type {VueFlag[]} */
    0: [
        { id: "NT_sync_perks",                 type: "boolean", value: false, },
        { id: "NT_team_perks",                 type: "boolean", value: true,  },
        { id: "NT_alt_heartache",              type: "boolean", value: false, },
        { id: "NT_ban_perks",                  type: "boolean", value: false,  },
        { id: "NT_sync_steve",                 type: "boolean", value: true,  },
        { id: "NT_sync_hearts",                type: "boolean", value: true,  },
        { id: "NT_sync_orbs",                  type: "boolean", value: true,  },
        { id: "NT_sync_orbs_no_curse",         type: "boolean", value: false, requires: [{"NT_sync_orbs": true}] }, //TODO actually check requires :)
        { id: "NT_sync_orb_count",             type: "number" , value: 0,     },
        { id: "NT_sync_shift",                 type: "boolean", value: true,  },
        { id: "NT_send_wands",                 type: "boolean", value: true,  },
        { id: "NT_send_flasks",                type: "boolean", value: true,  },
        { id: "NT_send_gold",                  type: "boolean", value: true,  },
        { id: "NT_send_items",                 type: "boolean", value: true,  },
        { id: "NT_world_randomize_loot",       type: "boolean", value: true,  },
        { id: "NT_sync_world_seed",            type: "number" , value: 0,     },
        { id: "NT_death_penalty",              type: "enum",    value: 'end', choices: ['end', 'weak_respawn', 'full_respawn'], },
        { id: "NT_ondeath_kick",               type: "boolean", value: false, },
    ],
    /** @type {VueFlag[]} */
    2: [
        { id: "NT_NEMESIS_ban_ambrosia",       type: "boolean", value: true,  },
        { id: "NT_NEMESIS_ban_invis",          type: "boolean", value: true,  },
        { id: "NT_NEMESIS_nemesis_abilities",  type: "boolean", value: true,  },
        { id: "NT_sync_steve",                 type: "boolean", value: false, },
        { id: "NT_sync_orbs",                  type: "boolean", value: false, },
        { id: "NT_sync_orbs_no_curse",         type: "boolean", value: false, requires: [{"NT_sync_orbs": true}] }, //TODO actually check requires :)
        { id: "NT_sync_orb_count",             type: "number" , value: 0,     },
        { id: "NT_world_randomize_loot",       type: "boolean", value: true,  },
        { id: "NT_sync_world_seed",            type: "number" , value: 0,     },
        { id: "NT_death_penalty",              type: "enum", value: 'weak_respawn', choices: ['weak_respawn'], },
        { id: "NT_ondeath_kick",               type: "boolean", value: true,  }
    ]
};

/**
 * @param {GameMode} gamemode
 * @param {VueFlag[]} current
 * @param {IGameFlag[]} update
 * @returns {VueFlag[]}
 */
export const updateFlagsFromProto = (gamemode, current, update) => {
    /** @type {VueFlag[]} */
    const defaults = defaultFlags[gamemode]
    /* eslint-disable no-unused-vars */
    return defaults.map((spec, _idx, _defaults) => {
        const found = update.find((f) => f.flag === spec.id)
        const prev = current.find((f) => f.id === spec.id) || spec
        /** @type {VueFlag} */
        const vueFlag = { ...spec }

        switch (spec.type) {
            case "boolean":
                // presence of a boolean flag currently indicates true,
                // absence indicates false. in the future, we should
                // send explicit true/false, and leave undefined for "unchanged"
                vueFlag.value = !!found
                break
            case "enum":
                var valid = spec.choices.find(
                    (choice) => choice === (found && found.strVal)
                )
                // we might receive an enum value that isn't a valid option - if so, ignore it
                vueFlag.value = firstOfType("string", valid, prev.value)
                break
            case "string":
                vueFlag.value = firstOfType("string", found.strVal, prev.value)
                break
            default: // numeric types
                vueFlag.value = firstOfType(
                    "number",
                    found.uIntVal,
                    found.intVal,
                    found.floatVal,
                    prev.value
                )
                break
        }
        return vueFlag
    })
}

/**
 * @param {GameMode} gamemode
 * @param {VueFlag[]} current
 * @param {VueFlag[]} update
 * @returns {VueFlag[]}
 */
export const updateFlagsFromUI = (gamemode, current, update) => {
    /** @type {VueFlag[]} */
    const defaults = defaultFlags[gamemode]
    /* eslint-disable no-unused-vars */
    return defaults.map((spec, _idx, _defaults) => {
        const found = update.find((f) => f.id === spec.id)
        const prev = current.find((f) => f.id === spec.id) || spec
        /** @type {VueFlag} */
        const vueFlag = { ...spec }

        switch (spec.type) {
            case "boolean":
                vueFlag.value = firstOfType("boolean", found.value, prev.value)
                break
            case "enum":
                // this should be unable to be incorrect, but we'll prevent sending erroneous data
                // by being "forward" about our error-checking, in case of a mistake
                var valid = spec.choices.find(
                    (choice) => choice === (found && found.value)
                )
                vueFlag.value = firstOfType("string", valid, prev.value)
                break
            case "string":
                vueFlag.value = firstOfType("string", found.value, prev.value)
                break
            default: // numeric types
                vueFlag.value = firstOfType("number", found.value, prev.value)
                break
        }
        return vueFlag
    })
}

/**
 * @param {GameMode} gamemode
 * @param {VueFlag[]} current
 * @returns {import('@noita-together/nt-message').NT.ClientRoomFlagsUpdate}
 */
export const flagsToProto = (gamemode, current) => {
    /** @type {VueFlag[]} */
    const defaults = defaultFlags[gamemode]
    return {
        /* eslint-disable no-unused-vars */
        flags: defaults.reduce((acc, spec, _idx, _defaults) => {
            const found = current.find((f) => f.id === spec.id)

            /** @type {IGameFlag} */
            const flag = { flag: spec.id }

            switch (spec.type) {
                case "boolean":
                    // presence of a boolean flag currently indicates true,
                    // absence indicates false. in the future, we should
                    // send explicit true/false, and leave undefined for "unchanged"
                    if (!found.value) return acc
                    break
                case "enum":
                case "string":
                    flag.strVal = found.value
                    break
                default:
                    if (!Number.isInteger(found.value))
                        flag.floatVal = found.value
                    else if (found.value < 0) flag.intVal = found.value
                    else flag.uIntVal = found.value
                    break
            }
            return acc.concat(flag)
        }, [])
    }
}

const ipcPlugin = (ipc) => {
    return (store) => {
        ipc.on("CONNECTED", (event, data) => {
            store.commit("setUser", data)
        })

        ipc.on("USER_EXTRA", (event, data) => {
            store.commit("setUserExtra", data)
        })

        ipc.on("SAVED_USER", (event, data) => {
            store.commit("setSavedUserName", data)
        })
        /*
        ipc.on("DEBUG_EVT", (event, data) => {
            // eslint-disable-next-line no-console
            console.log(data)
        })
        */

        ipc.on("UPDATE_DOWNLOADED", () => {
            store.dispatch("errDialog", {
                title: "Update available",
                body: "App finished downloading an update and will apply the next time you launch.",
                canClose: false
            })
        })

        ipc.on("CONNECTION_LOST", (event, data) => {
            store.dispatch("errDialog", {
                title: "Disconnected from server",
                body: `Received status code of ${data} when disconnected`,
                canClose: false
            })
        })

        ipc.on("sRoomUpdated", (event, data) => {
            store.commit("roomUpdated", data)
        })

        ipc.on("sRoomFlagsUpdated", (event, data) => {
            store.commit("sRoomFlagsUpdated", data)
        })

        ipc.on("sRoomDeleted", (event, data) => {
            store.commit("resetRoom", data)
        })

        ipc.on("sUserJoinedRoom", (event, data) => {
            store.commit("userJoinedRoom", data)
        })

        ipc.on("sUserLeftRoom", (event, data) => {
            //store.commit("chatMsg", `[System] ${store.state.rooms.users[data.userId]} has left the room.`)
            if (data.userId == store.state.user.id) {
                store.commit("resetRoom")
            } else {
                store.commit("userLeftRoom", data)
            }
        })

        ipc.on("sUserKicked", (event, data) => {
            //store.commit("chatMsg", `[System] ${store.state.rooms.users[data.userId]} has been kicked.`)
            if (data.userId == store.state.user.id) {
                store.commit("resetRoom")
            } else {
                store.commit("userLeftRoom", data)
            }
        })

        ipc.on("sUserBanned", (event, data) => {
            //store.commit("chatMsg", `[System] ${store.state.rooms.users[data.userId]} has been banned.`)
            if (data.userId == store.state.user.id) {
                store.commit("resetRoom")
            } else {
                store.commit("userLeftRoom", data)
            }
        })

        ipc.on("sUserReadyState", (event, data) => {
            //console.log({ gotready: data })
            store.commit("userReadyState", data)
        })

        ipc.on("sRoomAddToList", (event, data) => {
            store.commit("addRoom", data.room)
        })

        ipc.on("sRoomDeleted", (event, data) => {
            store.commit("deleteRoom", data.id)
        })

        ipc.on("sRoomList", (event, data) => {
            store.commit("setRooms", data.rooms)
        })

        ipc.on("sChat", (event, data) => {
            store.commit("pushChat", data)
        })

        ipc.on("sStatUpdate", (event, data) => {
            store.commit("setStats", data)
        })

        /*
        ipc.on("sDisconnected", (e, reason) => {
            //Show disconnection msg ?
        })
        */
    }
}

const ipcStuff = ipcPlugin(ipcRenderer)
//TODO hot reloading support https://vuex.vuejs.org/guide/hot-reload.html
//TODO plugins https://vuex.vuejs.org/guide/plugins.html
export default new Vuex.Store({
    state: {
        // TODO: these should not be part of state, but I'm leaving them here
        // so that I don't have to hunt down references to them and fix everything
        defaultFlags: defaultFlags,
        gamemodes: gamemodes,
        tabs: {
            0: "Users",
            1: "Mods",
            2: "Seeds"
        },
        user: {
            name: "",
            id: 0,
            extra: 0,
            color: ""
        },
        savedUser: false,
        savedUserName: "",
        lobbies: [],
        roomTab: "0",
        room: {
            id: "",
            name: "",
            gamemode: 0,
            maxUsers: 0,
            password: "",
            //users[id]
            users: [
                /*{
                    userId: String,
                    name: String,
                    owner: Boolean,
                    ready: Boolean,
                    seed: String,
                    mods: [String]
                }*/
            ]
        },
        roomFlags: [],
        roomChat: [],
        loading: false,
        joining: false,
        errDialog: {
            title: "",
            body: "",
            canClose: true
        },
        showErrDialog: false,
        stats: null, 
    },
    getters: {
        isHost: (state) => {
            const users = state.room.users
            for (const user of users) {
                if (user.userId == state.user.id) {
                    return user.owner ? true : false
                }
            }
            return false
        },
        userName: (state) => {
            return state.user.name
        },
        userId: (state) => {
            return state.user.id
        },
        userExtra: (state) => {
            return state.user.extra
        },
        roomId: (state) => {
            return state.room.id
        },
        roomName: (state) => {
            return state.room.name
        },
        roomGamemode: (state) => {
            return state.room.gamemode
        },
        roomMaxUsers: (state) => {
            return state.room.maxUsers
        },
        roomHasPassword: (state) => {
            return state.room.protected
        },
        stats: (state) => {
            return JSON.parse(state.stats)
        },
        flags: (state) => {
            return state.roomFlags
        },
        protoFlags: (state) => {
            return flagsToProto(state.room.gamemode, state.roomFlags)
        }, 
    },
    mutations: {
        setSavedUserName: (state, value) => {
            state.savedUser = !!value
            state.savedUserName = value
        },
        setLoading: (state, value) => {
            state.loading = value
        },
        setTab: (state, value) => {
            state.roomTab = value
        },
        joinState: (state, payload) => {
            state.joining = payload
        },
        userReadyState: (state, payload) => {
            state.room.users = state.room.users.map((user) => {
                if (user.userId == payload.userId) {
                    user.ready = payload.ready
                    user.seed = payload.seed
                    user.mods = payload.mods
                    user.version = payload.version
                    user.beta = payload.beta
                }
                return user
            })
        },

        setUser: (state, payload) => {
            state.user.name = payload.display_name
            state.user.id = payload.id
            state.user.color = randomColor(payload.display_name)
        },
        setUserExtra: (state, payload) => {
            state.user.extra = payload
        },
        addRoom: (state, payload) => {
            state.lobbies.push(payload)
        },
        deleteRoom: (state, id) => {
            state.lobbies = state.lobbies.filter((room) => room.id != id)
        },
        setRooms: (state, payload) => {
            state.lobbies = payload
        },
        setRoom: (state, payload) => {
            state.room = payload
            for (const user of state.room.users) {
                user.color = randomColor(user.name)
            }
        },
        roomUpdated: (state, payload) => {
            let room = Object.assign(state.room)
            state.room = Object.assign(room, payload)
        },
        sRoomFlagsUpdated: (state, payload) => {
            state.roomFlags = updateFlagsFromProto(
                state.room.gamemode,
                state.roomFlags,
                payload.flags
            )
        },
        cRoomFlagsUpdated: (state, payload) => {
            state.roomFlags = updateFlagsFromUI(
                state.room.gamemode,
                state.roomFlags,
                payload
            )
        },
        resetRoom: (state) => {
            state.stats = null
            state.room = {
                id: "",
                name: "",
                gamemode: 0,
                maxUsers: 0,
                password: "",
                users: [],
                locked: false
            }
            state.roomFlags = []
            state.roomChat = []
        },
        userJoinedRoom: (state, payload) => {
            //assume that connected user is already a user, unless we don't find them
            let existingUser = state.room.users.find((user => user.userId === payload.userId))
            let user = existingUser
            if(!user){
                //user does not exist yet. create an object to hold their data
                user = {
                    userId: payload.userId,
                        name: payload.name,
                        owner: false,
                        color: randomColor(payload.name),
                }
            }
            user.readyState =  {
                ready: false,
                    seed: "",
                    mods: []
            }
            if(existingUser) return
            //user does not exist yet. push the user to the users table
            state.room.users.push(user)
        },
        userLeftRoom: (state, payload) => {
            const users = state.room.users
            for (const [i, user] of users.entries()) {
                if (user.userId === payload.userId) {
                    users.splice(i, 1)
                }
            }
        },
        setErrDialog: (state, payload) => {
            state.errDialog = payload
        },
        showErrDialog: (state, payload) => {
            state.showErrDialog = payload
        },
        setStats: (state, payload) => {
            state.stats = payload
        },
        pushChat: (state, payload) => {
            const time = new Date()
            let timeStr =
                ("0" + time.getHours()).slice(-2) +
                ":" +
                ("0" + time.getMinutes()).slice(-2)
            const found = state.room.users.find(
                (user) => user.userId === payload.userId
            )
            let userColor = randomColor(payload.name)
            userColor = (found && found.color) || userColor
            let userRegex = new RegExp(`(@${state.user.name})(?= |$)`, "i")
            let messageClass = userRegex.test(payload.message)
                ? "mention"
                : "chat-entry"
            let messageSpans = payload.message
                .split(userRegex)
                .filter(String)
                .map((msg) => ({
                    message: msg,
                    style: {
                        color: userRegex.test(msg)
                            ? randomColor(state.user.name)
                            : "rgba(255, 255, 255, 0.8)",
                        fontWeight: userRegex.test(msg) ? 600 : 400
                    }
                }))
            if (payload.userId === "-1") {
                userColor = "#e69569"
            }
            state.roomChat.push({
                id: payload.id,
                time: timeStr,
                userId: payload.userId,
                name: payload.name.trim(),
                class: messageClass,
                spans: messageSpans,
                color: userColor
            })
            if (state.roomChat.length > 250) {
                state.roomChat.shift()
            }
        },
        setDefaultFlags: (state, mode) => {
            if (mode == 0 || mode == 2) {
                state.roomFlags = [...state.defaultFlags[mode]]
            }
        }
    },
    actions: {
        updateTab: async ({ commit }, payload) => {
            commit("setTab", payload)
        },
        continueSavedUser: ({ state, commit, dispatch }) => {
            commit("setLoading", true)
            ipcRenderer.send("TRY_LOGIN", state.savedUserName)
            ipcRenderer.once("TRY_LOGIN_FAILED", () => {
                dispatch("errDialog", {
                    title: "Failed to login",
                    body: "Login manually with the remember me checkbox checked to refresh your login info.",
                    canClose: true
                })
                commit("setLoading", false)
            })
        },
        deleteSavedUser: ({ state, dispatch }) => {
            ipcRenderer.send("DELETE_USER", state.savedUserName)
            ipcRenderer.once("DELETE_USER_FAILED", () => {
                dispatch("errDialog", {
                    title: "Failed to delete saved user",
                    body: "Restart the app and try again.",
                    canClose: true
                })
            })
        },
        errDialog: ({ commit }, payload) => {
            commit("setErrDialog", payload)
            commit("showErrDialog", true)
        },
        joinRoom: ({ dispatch, commit }, payload) => {
            commit("setLoading", true)
            ipcRenderer.send("CLIENT_MESSAGE", { key: "cJoinRoom", payload })

            ipcRenderer.once("sJoinRoomSuccess", (event, data) => {
                commit("setRoom", data)
                commit("setLoading", false)
            })

            ipcRenderer.once("sJoinRoomFailed", (event, data) => {
                dispatch("errDialog", {
                    title: "Failed to join room",
                    body: data.reason,
                    canClose: true
                })
                commit("setLoading", false)
            })
        },
        createRoom: async ({ commit, dispatch }, payload) => {
            commit("setLoading", true)
            ipcRenderer.send("CLIENT_MESSAGE", { key: "cRoomCreate", payload })
            ipcRenderer.once("sRoomCreated", (event, data) => {
                commit("setDefaultFlags", data.gamemode)
                commit("setRoom", data)
                commit("setLoading", false)
                dispatch("sendFlags")
                return true
            })

            ipcRenderer.once("sRoomCreateFailed", (event, data) => {
                dispatch("errDialog", {
                    title: "Failed to create room",
                    body: data.reason,
                    canClose: true
                })
                commit("setLoading", false)
                return false
            })
        },
        updateRoom: async ({ dispatch, commit }, payload) => {
            commit("setLoading", true)
            ipcRenderer.send("CLIENT_MESSAGE", { key: "cRoomUpdate", payload })
            ipcRenderer.once("sRoomUpdated", () => {
                commit("setLoading", false)
                return true
            })

            ipcRenderer.once("sRoomUpdateFailed", (event, data) => {
                dispatch("errDialog", {
                    title: "Failed to update room",
                    body: data.reason,
                    canClose: true
                })
                commit("setLoading", false)
                return false
            })
        },
        leaveRoom: async ({ getters, commit }) => {
            commit("setLoading", true)
            const key = getters.isHost ? "cRoomDelete" : "cLeaveRoom"
            const payload = {
                id: getters.roomId,
                userId: getters.userId
            }
            ipcRenderer.send("CLIENT_MESSAGE", { key, payload })
            const evt = getters.isHost ? "sRoomDeleted" : "sUserLeftRoom"
            ipcRenderer.once(evt, (event, data) => {
                if (evt == "sUserLeftRoom") {
                    if (data.userId == getters.userId) {
                        commit("setLoading", false)
                        return true
                    }
                } else {
                    commit("setLoading", false)
                    return true
                }
            })
        },
        kickUser: async ({ commit }, payload) => {
            commit("setLoading", true)
            ipcRenderer.send("CLIENT_MESSAGE", { key: "cKickUser", payload })
            ipcRenderer.on("sUserKicked", () => {
                commit("setLoading", false)
                return true
            })
        },
        banUser: async ({ commit }, payload) => {
            commit("setLoading", true)
            ipcRenderer.send("CLIENT_MESSAGE", { key: "cBanUser", payload })
            ipcRenderer.on("sUserBanned", () => {
                commit("setLoading", false)
                return true
            })
        },
        requestRooms: async (context, payload) => {
            ipcRenderer.send("CLIENT_MESSAGE", {
                key: "cRequestRoomList",
                payload: { page: payload && payload > 0 ? payload : 0 }
            })
        },
        sendChat: ({ commit, state }, payload) => {
            ipcRenderer.send("CLIENT_CHAT", {
                key: "cChat",
                payload
            })
            commit("pushChat", {
                id: payload.id,
                userId: state.user.id,
                name: state.user.name.trim(),
                message: payload.message.trim()
            })
        },
        sendClientAlert: ({ commit }, payload) => {
            commit("pushChat", {
                id: "alert",
                userId: "-1",
                name: "Alert",
                message: payload.message.trim()
            })
        },
        sendFlags: ({ getters, state }) => {
            ipcRenderer.send("CLIENT_MESSAGE", {
                key: "cRoomFlagsUpdate",
                payload: flagsToProto(state.room.gamemode, getters.flags)
            })
        },
        startRun: (context, payload) => {
            ipcRenderer.send("CLIENT_MESSAGE", {
                key: "cStartRun",
                payload
            })
        }
    },
    plugins: [ipcStuff]
})

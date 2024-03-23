const { TypedEmitter } = require("tiny-typed-emitter")
const { NT } = require("@noita-together/nt-message")
const {
    OUTCOME,
    OUTCOME_INVERSE,
    STATE,
    PersistentWebSocket
} = require("./ws-transport")
const Debug = require("debug")
const debug = Debug("nt:ntlobby")

const DROP = 0
const REPLACE = 1
const QUEUE = 2

const POLICY_INVERSE = {
    [DROP]: "DROP",
    [REPLACE]: "REPLACE",
    [QUEUE]: "QUEUE"
}

/** @type {Record<Required<NT.GameAction['action']>, typeof DROP|typeof REPLACE|typeof QUEUE} */
const GameActionPolicy = {
    cAngerySteve: QUEUE,
    cChat: QUEUE,
    // we have no insight into custom mod events, unsure whether it's more harmful
    // to drop them or queue them. ask the dev thread?
    cCustomModEvent: DROP,

    // the host disconnecting will ruin everything, these are currently not going to do anything
    cHostItemBank: DROP,
    cHostUserTake: DROP,
    cHostUserTakeGold: DROP,

    cNemesisAbility: QUEUE,
    cNemesisPickupItem: QUEUE,

    cPlayerAddGold: QUEUE,
    cPlayerAddItem: QUEUE,
    cPlayerDeath: QUEUE, // uncertain behavior? how does the local game behave here?
    cPlayerMove: REPLACE,
    cPlayerNewGamePlus: QUEUE,
    cPlayerPickup: QUEUE,
    cPlayerSecretHourglass: QUEUE,
    cPlayerTakeGold: QUEUE,
    cPlayerTakeItem: QUEUE,
    cPlayerUpdate: REPLACE,
    cPlayerUpdateInventory: QUEUE,

    cRespawnPenalty: QUEUE
}

/** @type {Record<Required<NT.LobbyAction['action']>, typeof DROP|typeof REPLACE|typeof QUEUE} */
const LobbyActionPolicy = {
    // host actions are also not going to do anything, since the host disconnecting destroys the room
    cBanUser: QUEUE,
    cKickUser: QUEUE,
    cRunOver: QUEUE,
    cStartRun: QUEUE,

    // other actions "shouldn't" be able to be sent while reconnecting - the ui should pause
    // however, if they happen to be sent anyway, not receiving a response from the server may
    // cause the ui to entirely lock up while waiting for a response that will never come. so,
    // most of these are listed as "queue" even though they should probably be "drop", just to
    // hedge our bets against race conditions or poorly-understood code flow
    cJoinRoom: QUEUE,
    cLeaveRoom: QUEUE,

    cReadyState: QUEUE,
    cRequestRoomList: QUEUE,
    cRoomCreate: QUEUE,
    cRoomDelete: QUEUE,
    cRoomFlagsUpdate: QUEUE,
    cRoomUpdate: QUEUE
}

/**
 * @extends {TypedEmitter<{
 *  'ntmessage': (this: NTLobbyWebsocket, message: NT.Envelope) => void,
 *  'open': () => void,
 *  'close': () => void,
 *  'reconnecting': () => void,
 * }>}
 */
class NTLobbyWebsocket extends TypedEmitter {
    /**
     * @param {string} token
     * @param {import('./ws-transport').WsTransportConfig|undefined} cfg
     */
    constructor(token, cfg) {
        super()

        /** @type {{kind: string, action: string, encoded: Uint8Array}[]} */
        this.queuedMessages = []

        this.pws = new PersistentWebSocket(token, cfg)
        this.pws.on("message", (buf) => {
            debug("NTLobbyWebsocket PWS message handler")
            try {
                const decoded = NT.Envelope.decode(buf)
                // debug("decoded", decoded)
                this.emit("ntmessage", decoded)
            } catch (err) {
                console.log(`Failed to decode NT message: ${err.message}`)
            }
        })
        this.pws.on("statechange", (newState, prevState) => {
            switch (newState) {
                case STATE.CONNECTING:
                    if (prevState === STATE.CONNECTED) this.emit("reconnecting")
                    break
                case STATE.CONNECTED:
                    this._flushQueuedMessages()
                    this.emit("open")
                    break
                case STATE.DISCONNECTED:
                    break
                case STATE.DESTROYED:
                    this.emit("close")
                    break
            }
        })
        this.pws.connect()
    }

    /** @private */
    _flushQueuedMessages() {
        debug(
            `NTLobbyWebsocket._flushQueuedMessages(): queuedMessages=${this.queuedMessages.length}`
        )
        this.queuedMessages.forEach(({ kind, action, encoded }) => {
            this._trySend(kind, action, encoded, DROP)
        })
        this.queuedMessages.length = 0
    }

    /**
     * @private
     * @param {Required<NT.Envelope['kind']>} kind
     * @param {string} action
     * @param {any} payload
     * @param {typeof DROP|typeof REPLACE|typeof QUEUE} policy
     */
    _trySend(kind, action, payload, policy) {
        debug(`NTLobbyWebsocket._trySend(): kind=${kind} action=${action}`)
        /** @var {Uint8Array} */

        let encoded
        try {
            if (payload instanceof Uint8Array) {
                encoded = payload
            } else {
                encoded = NT.Envelope.encode({
                    [kind]: { [action]: payload }
                }).finish()
            }
        } catch (err) {
            console.log(`Failed to encode NT message: ${err.message}`)
            return
        }

        this.pws.send(encoded, (outcome) => {
            debug(
                `NTLobbyWebsocket._sendEncoded() PWS callback: outcome=${OUTCOME_INVERSE[outcome]} policy=${POLICY_INVERSE[policy]}`
            )
            if (outcome === OUTCOME.SEND_SUCCESS) return

            switch (policy) {
                case DROP:
                    return
                case REPLACE:
                    const found = this.queuedMessages.find(
                        (qm) => qm.type === kind && qm.action === action
                    )
                    if (found) {
                        found.encoded = encoded
                        break
                    }
                // fall through if not found
                case QUEUE:
                    this.queuedMessages.push({ kind, action, encoded })
                    break
                default:
                    throw new Error("Unknown send policy: " + policy)
            }
        })
    }

    /** @param {Required<NT.GameAction['action']>} action */
    sendGameMsg(action, payload) {
        debug(`NTLobbyWebsocket._sendGameMsg(): action=${action}`)
        this._trySend(
            "gameAction",
            action,
            payload,
            Object.prototype.hasOwnProperty.call(GameActionPolicy, action)
                ? GameActionPolicy[action]
                : DROP
        )
    }

    /** @param {Required<NT.LobbyAction['action']>} action */
    sendLobbyMsg(action, payload) {
        debug(`NTLobbyWebsocket._sendLobbyMsg(): action=${action}`)
        this._trySend(
            "lobbyAction",
            action,
            payload,
            Object.prototype.hasOwnProperty.call(LobbyActionPolicy, action)
                ? LobbyActionPolicy[action]
                : DROP
        )
    }
}

module.exports = { NTLobbyWebsocket }

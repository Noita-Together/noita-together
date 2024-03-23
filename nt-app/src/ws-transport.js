const { TypedEmitter } = require("tiny-typed-emitter")
const { FibonacciBackoff } = require("simple-backoff")
const WebSocket = require("ws")
const { v4: uuidv4 } = require("uuid")

const Debug = require("debug")
const debug = Debug("nt:pws")

/** @typedef {{host: string, sni: string}} WsTransportConfig */

/** @var {WsTransportConfig} envTransport */
const envTransport = (() => {
    const prefix =
        process.env.VUE_APP_LOBBY_SERVER_WS_URL_BASE ||
        `wss://` + (process.env.VUE_APP_HOSTNAME_WS || "noitatogether.com/ws/")
    const host = prefix.endsWith("/") ? prefix : `${prefix}/`
    const url = new URL(host)
    const sni = url.hostname

    return { host, sni }
})()

// send status values
const SEND_SUCCESS = 0
const SEND_SOCKET_UNAVAILABLE = 1
const SEND_ERROR_ABORTED = 2

const OUTCOME = { SEND_SUCCESS, SEND_SOCKET_UNAVAILABLE, SEND_ERROR_ABORTED }
const OUTCOME_INVERSE = {
    [SEND_SUCCESS]: "SEND_SUCCESS",
    [SEND_SOCKET_UNAVAILABLE]: "SEND_SOCKET_UNAVAILABLE",
    [SEND_ERROR_ABORTED]: "SEND_ERROR_ABORTED"
}
/** @typedef {typeof SEND_SUCCESS|typeof SEND_SOCKET_UNAVAILABLE|typeof SEND_ERROR_ABORTED} SendStatus */

// state / intent values
const DISCONNECTED = 0
const CONNECTED = 1
const CONNECTING = 2
const DESTROYED = 3

const STATE = { DISCONNECTED, CONNECTED, CONNECTING, DESTROYED }
const STATE_INVERSE = {
    [DISCONNECTED]: "DISCONNECTED",
    [CONNECTED]: "CONNECTED",
    [CONNECTING]: "CONNECTING",
    [DESTROYED]: "DESTROYED"
}
/** @typedef {typeof DISCONNECTED|typeof CONNECTING|typeof CONNECTED|typeof DESTROYED} SocketState */

/**
 * @extends {TypedEmitter<{
 *  'message': (this: PersistentWebSocket, data: WebSocket.RawData, isBinary: boolean) => void
 *  'statechange': (this: PersistentWebSocket, state: SendState, prev: SendState) => void
 * }>}
 */
class PersistentWebSocket extends TypedEmitter {
    /**
     * @param {string} token
     * @param {WsTransportConfig|undefined} cfg
     */
    constructor(token, cfg = envTransport) {
        super()

        /** @type {string} */
        this.token = token
        /** @type {Exclude<SocketState, typeof CONNECTING>} */
        this.intent = DISCONNECTED
        /** @type {SocketState} */
        this.state = DISCONNECTED
        /** @type {WsTransportConfig} */
        this.cfg = cfg
        /** @type {WebSocket|null} */
        this.ws = null
        /** @type {string} */
        this.sessionId = uuidv4()
        /** @type {string[]} */
        this.closeReasons = []
        /** @type {FibonacciBackoff} */
        this.backoff = new FibonacciBackoff({
            min: 50,
            max: 10000
        })
    }

    /** @private */
    /** @param {SocketState} state */
    _setState(state) {
        debug(
            `PersistentWebSocket._setState: ${STATE_INVERSE[this.state]} -> ${
                STATE_INVERSE[state]
            }`
        )
        if (this.state === state) return

        const prev = this.state
        this.state = state
        setTimeout(() => {
            this.emit("statechange", state, prev)
        }, 0)
    }

    connect() {
        debug("PersistentWebSocket.connect()")

        switch (this.intent) {
            case DESTROYED:
                throw new Error("Cannot connect a destroyed transport")
            case DISCONNECTED:
                this.intent = CONNECTED
                break
            case CONNECTED:
                break
        }

        this._maybeConnect()
    }

    /** @private */
    _maybeConnect() {
        debug(
            `PersistentWebSocket._maybeConnect(): intent=${
                STATE_INVERSE[this.intent]
            } state=${STATE_INVERSE[this.state]}`
        )

        switch (this.state) {
            case DESTROYED:
                throw new Error("state is DESTROYED, should not happen!")
            case CONNECTED:
                // already connected
                return
            case CONNECTING:
            case DISCONNECTED:
                // actually try to connect
                break
        }

        this._setState(CONNECTING)
        const ws = new WebSocket(`${this.cfg.host}${this.token}`, {
            headers: {
                "x-session-id": this.sessionId
            },
            servername: this.cfg.sni,
            timeout: 5000
        })

        /** @param {string} closeReason */
        const cleanup = (closeReason) => {
            this._setState(DISCONNECTED)
            this.closeReasons.push(closeReason)

            ws.removeListener("open", onConnect)
            ws.removeListener("error", onConnectError)
            ws.removeListener("close", onConnectClose)

            const next = this.backoff.next()
            debug("Attempting reconnect in", next, "ms")
            setTimeout(() => this._maybeConnect(), next)
        }

        const onConnect = () => {
            cleanup()
            this.backoff.reset()

            this._setState(CONNECTED)
            this._connected(ws)
        }
        ws.once("open", onConnect)

        const onConnectError = (err) => {
            const code = err.code || "NO_ERR_CODE"
            cleanup(`connect ${code} ${err.message}`)
        }
        ws.once("error", onConnectError)

        const onConnectClose = (code, reason) => {
            cleanup(
                `connect ${code} ${reason ? reason.toString() : "undefined"}`
            )
        }
        ws.once("close", onConnectClose)
    }

    /** @private */
    _disconnected() {
        debug(`PersistentWebSocket._disconnected()`)
        this.ws = null
        this._setState(DISCONNECTED)
        this._maybeConnect()
    }

    /** @private */
    /** @param {string} closeReason */
    _errorClose(closeReason) {
        debug(`PersistentWebSocket._errorClose(): closeReason=${closeReason}`)
        this.closeReasons.push(closeReason)
        this.ws.terminate()
        this._disconnected()
    }

    /** @private */
    /** @param {WebSocket} ws */
    _connected(ws) {
        debug(
            `PersistentWebSocket._connected(): Connected to lobby server ${this.cfg.host}`
        )
        this.ws = ws
        this._setState(CONNECTED)

        const heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.ping()
            }
        }, 10000)

        /** @param {string} closeReason */
        const cleanup = (closeReason) => {
            this.closeReasons.push(closeReason)
            clearInterval(heartbeat)

            ws.removeListener("message", onMessage)
            ws.removeListener("close", onClose)
            ws.removeListener("error", onError)

            this._disconnected()
        }

        const onClose = (code, reason) => {
            cleanup(
                `server ${code} ${reason ? reason.toString() : "undefined"}`
            )
        }
        ws.once("close", onClose)

        const onError = (err) => {
            this.ws.terminate()

            const code = err.code || "NO_ERR_CODE"
            cleanup(`server ${code} ${err.message}`)
        }
        ws.once("error", onError)

        const onMessage = (data, isBinary) => {
            this.emit("message", data, isBinary)
        }
        ws.on("message", onMessage)

        this.ws = ws
    }

    /** @param {Uint8Array} buf */
    /** @param {(outcome: SendStatus) => void} onSent */
    send(buf, onSent) {
        debug(
            `PersistentWebSocket.send(): intent=${
                STATE_INVERSE[this.intent]
            } this.ws=${!!this.ws} this.ws.readyState(OPEN)=${
                this.ws !== null && this.ws.readyState === WebSocket.OPEN
            }`
        )
        if (this.intent !== CONNECTED) {
            throw new Error("cannot send to disconnected PersistentWebSocket")
        }

        if (this.ws === null || this.ws.readyState !== WebSocket.OPEN) {
            onSent(SEND_SOCKET_UNAVAILABLE)
            return
        }

        this.ws.send(buf, (err) => {
            if (err != null) {
                const code = err.code || "NO_ERR_CODE"
                this._errorClose(`${code} ${err.message}`)
                onSent(SEND_ERROR_ABORTED)
            } else {
                onSent(SEND_SUCCESS)
            }
        })
    }

    /**
     * @param {number} code
     * @param {string} reason
     */
    end(code, reason) {
        debug(`PersistentWebSocket.end(): code=${code} reason=${reason}`)
        this.closeReasons.push(`client ${code} ${reason}`)
        this.intent = DESTROYED
        this.ws.close(code, reason)
        this.ws = null
    }
}

module.exports = {
    OUTCOME,
    OUTCOME_INVERSE,
    STATE,
    STATE_INVERSE,
    PersistentWebSocket
}

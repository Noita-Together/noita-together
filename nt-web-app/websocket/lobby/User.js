import {decode} from "../messageHandler";
import {noop} from "./LobbyUtils"

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
        this.socket._sender.sendFrame(data)//why no worky
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

export{
    User
}
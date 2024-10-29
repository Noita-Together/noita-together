//this file's purpose is to fetch and report the rooms available to it, given a server websocket and authentication
const { v4: uuidv4 } = require("uuid")
const ws = require("ws")

/**
 * Websocket API to list rooms for the server.
 *
 * This object supplies listeners to subscribe to, and does not communicate with other objects other than itself
 */
class RoomListingApi{
    private readonly wsEndpoint: string;
    private readonly token: string;
    private provider: string;
    isConnected = false
    isConnecting = false
    wsConnection?: WebSocket

    constructor(wsEndpoint: string, token: string, provider: string, listener: RoomListingListener) {
        this.wsEndpoint = wsEndpoint;
        this.token = token;
        this.provider = provider;
    }

    async connect(): Promise<boolean> {
        isConnecting = true
        wsConnection = new WebSocket(this.wsEndpoint + '/' + ROOM_ENDPOINT_POSTFIX + '/' + this.token)
        this.wsConnection.onopen = () => {
            this.isConnected = true
            this.isConnecting = false
            this.refreshListingManually()
        }
    }

    async refreshListingManually(){
        //TODO
    }
}

interface RoomListingListener{
    onConnectionEvent(connected: boolean): void
    onRoomsUpdated(): void
}

interface Rooms{
    provider: string
    name: string
    host: string
    maxPlayers: string
    currentPlayers: string
    gameMode: string
    requiresPassword: boolean
    locked: boolean
    createdAt: string|undefined //ISO 8601 date UTC. potentially only show to users with admin status
}

const ROOM_ENDPOINT_POSTFIX = 'v1/lobby/list'
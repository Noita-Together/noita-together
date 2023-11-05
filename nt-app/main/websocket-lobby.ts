import {ServerConfig} from "./background";
import {WebSocket} from "ws"

class WebsocketLobby{
    private client: WebSocket;
    constructor(access_token: string, config: ServerConfig) {
        const url = `${config.is_ws_secure ? 'wss://' : 'ws://'}${config.ws}/${access_token}`
        console.log(url)
        this.client = new WebSocket(url)
        console.log('Opening')
        this.client.on('message', (data) => {
            console.log(data.toString())
        })
        this.client.on('open', ()=> {
            console.log('Opened websocket')
        })
    }

    close(){
        this.client.close()
    }
}

export {
    WebsocketLobby
}
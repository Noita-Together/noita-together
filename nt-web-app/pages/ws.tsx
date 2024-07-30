import {useEffect, useState} from "react";

const WSRender = () => {
    const [message, setMessage] = useState('not inited')
    useEffect(() => {
        const ws = new WebSocket('ws://127.0.0.1:8080');

        ws.onopen = () => {
            console.log('Connected to server');

            ws.send('Hello, server!');
        }

        ws.onmessage = (event) => {
            console.log(`Received message from server: ${event.data}`);
            setMessage(`Received message from server: ${event.data}`)
            return true
        };

        ws.onclose = () => {
            console.log('Disconnected from server');
            setMessage('Disconnected from server')
        };

        ws.onerror = () => {
            console.log('Err');
            setMessage('Err from server')
        }
    }, [])
    return <>
        Hello! <br></br>
        {message}
    </>
}
export default WSRender
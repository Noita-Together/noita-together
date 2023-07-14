import WebSocket from "ws";

function noop() { }

function MakeFrame(data) {
    let readOnly = true
    let buf = null
    if (data instanceof ArrayBuffer) {
        buf = Buffer.from(data)
    } else if (ArrayBuffer.isView(data)) {
        buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength)
    } else {
        buf = Buffer.from(data)
        readOnly = false
    }
    const list = WebSocket.Sender.frame(buf, {
        readOnly,
        mask: false,
        rsv1: false,
        opcode: 2,
        fin: true
    })
    return list
}

export {
    noop,
    MakeFrame
}
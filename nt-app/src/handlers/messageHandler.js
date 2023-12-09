const { NT } = require("nt-message")

/**
 * @returns {NT.Envelope}
 */
function decode(buf) {
    try {
        return NT.Envelope.decode(buf)
    } catch (err) {
        console.log(`Something fked up decoding ${err}`)
    }
}

/**
 * @param {NT.Envelope} obj
 * @returns
 */
function encode(obj) {
    try {
        return NT.Envelope.encode(obj).finish()
    } catch (err) {
        console.log(`Something fked up encoding ${err}`)
    }
}

function encodeGameMsg(type, data) {
    return encode({ gameAction: { [type]: data } })
}

function encodeLobbyMsg(type, data) {
    return encode({ lobbyAction: { [type]: data } })
}

export { decode, encode, encodeGameMsg, encodeLobbyMsg }

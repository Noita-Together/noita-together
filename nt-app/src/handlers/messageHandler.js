const { NT } = require("@noita-together/nt-message")

/**
 * @returns {NT.Envelope}
 */
function decode(buf) {
    try {
        const decoded = NT.Envelope.decode(buf)
        return decoded
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

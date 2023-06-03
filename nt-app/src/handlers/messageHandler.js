const path = require("path");
const protobuf = require("protobufjs");

//const root = protobuf.loadSync(path.join(__static, "./messages.proto"))
const root = protobuf.loadSync(path.join(__static, "./messages.proto"))
const proto = root.lookupType("Envelope");

function decode(buf) {
    try {
        const decoded = proto.decode(buf);
        const error = proto.verify(decoded);
        if (error) {
            throw error;
        } else {
            return decoded;
        }
    } catch (err) {
        console.log(`Something fked up decoding ${err}`);
    }
}

function encode(obj) {
    try {
        const error = proto.verify(obj);
        if (error) {
            throw error;
        } else {
            const encoded = proto.encode(obj).finish();
            return encoded;
        }
    } catch (err) {
        console.log(`Something fked up encoding ${err}`);
    }
}

function encodeGameMsg(type, data) {
    const payload = { gameAction: {} };
    payload.gameAction[type] = data;
    return encode(payload);
}

function encodeLobbyMsg(type, data) {
    const payload = { lobbyAction: {} };
    payload.lobbyAction[type] = data;
    return encode(payload);
}

module.exports = {
    decode,
    encode,
    encodeGameMsg,
    encodeLobbyMsg
};

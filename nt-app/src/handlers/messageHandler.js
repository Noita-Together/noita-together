/** @type {import('../gen/messages_pb')} */
const { Envelope } = require('../gen/messages_pb.js');

function decode(buf) {
  try {
    return Envelope.fromBinary(buf);
  } catch (err) {
    console.log(`Something fked up decoding ${err}`);
  }
}

/**
 * @param {import('../gen/messages_pb').Envelope} obj
 * @returns
 */
function encode(obj) {
  try {
    return new Envelope(obj).toBinary();
  } catch (err) {
    console.log(`Something fked up encoding ${err}`);
  }
}

function encodeGameMsg(type, data) {
  /** @type {import('../gen/messages_pb').GameAction} */
  const gameAction = {
    action: {
      case: type,
      value: data,
    },
  };
  return encode({
    kind: {
      case: 'gameAction',
      value: gameAction,
    },
  });
}

function encodeLobbyMsg(type, data) {
  /** @type {import('../gen/messages_pb').LobbyAction} */
  const lobbyAction = {
    action: {
      case: type,
      value: data,
    },
  };
  return encode({
    kind: {
      case: 'lobbyAction',
      value: lobbyAction,
    },
  });
}

module.exports = {
  decode,
  encode,
  encodeGameMsg,
  encodeLobbyMsg,
};

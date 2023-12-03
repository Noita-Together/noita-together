const { NT } = require('nt-message');

/**
 * @returns {NT.Envelope}
 */
function decode(buf) {
  try {
    return NT.Envelope.decode(buf);
  } catch (err) {
    console.log(`Something fked up decoding ${err}`);
  }
}

/**
 * @param {NT.Envelope} obj
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
  /** @type {NT.GameAction} */
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
  /** @type {NT.LobbyAction} */
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

const { createFrameCoder } = require("nt-message")

export const { encodeFrames, decodeFrames } = createFrameCoder()

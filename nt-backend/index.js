const mongoose = require("mongoose")
const http = require("http")
const wsserver = http.createServer()

const ws = require("./ws")(wsserver)

wsserver.listen(1337, () => {
    console.log("Running.")
})
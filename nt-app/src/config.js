const { app } = require("electron");
const fs = require("fs");

module.exports = {
    loadSettings: function() {
        try {
            // file path to config
            const filePath = app.getPath("userData") + '/config.json';

            // if config doesn't exist, make one, fill with environment variables
            if (!fs.existsSync(filePath)) {
                const settings = {
                    "profiles": [
                        {
                            "name": "Default", 
                            "webApp": process.env.VUE_APP_HOSTNAME, 
                            "lobbyServer": process.env.VUE_APP_LOBBY_SERVER_WS_URL_BASE
                        }
                    ], 
                    "selectedProfile": 0
                };

                fs.writeFileSync(filePath, JSON.stringify(settings));
                return settings;
            }

            // if config exists, read and return
            return JSON.parse(fs.readFileSync(filePath).toString());
        } catch (err) {
            console.error("Failed to load settings", err.toString());
        }
    }, 
    saveSettings: function(settings) {
        try {
            const filePath = app.getPath("userData") + '/config.json';
    
            fs.writeFileSync(filePath, JSON.stringify(settings));
        } catch (err) {
            console.error("Failed to save settings", err.toString());
        }
    }
}
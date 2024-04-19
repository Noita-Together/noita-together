const { app } = require("electron")
const fs = require("fs")
const path = require("path")

const CONFIG_PATH = path.resolve(app.getPath("userData"), "config.json")

const DEFAULT_PROFILE = {
    name: "Default",
    authUrl: process.env.VUE_APP_NT_LOGIN_URL || "https://noitatogether.com/api/auth/login",
    lobbyUrl: process.env.VUE_APP_LOBBY_SERVER_WS_URL_BASE || "wss://lobby.noitatogether.com/ws"
}

const settings = {
    selected: DEFAULT_PROFILE.name.toLowerCase(), 
    profiles: Object.create(null) // avoid prototype pollution bugs
}

function loadSettings() {
    try {
        const loadedSettings = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"))
        if (loadedSettings) {
          if (loadedSettings.profiles) {
            settings.profiles = Object.assign(Object.create(null), loadedSettings.profiles);
          }
          if (loadedSettings.selected && (loadedSettings.selected in settings.profiles)) {
            settings.selected = loadedSettings.selected;
          }
        }
    } catch (err) {
        // json was invalid or file wasn't present
        console.error("Failed to load settings", err.toString())
    }
}

function saveSettings() {
    if (settings.profiles.hasOwnProperty(DEFAULT_PROFILE.name.toLowerCase())) {
        delete settings[DEFAULT_PROFILE.name.toLowerCase()];
    }

    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(settings))
    } catch (err) {
        console.error("Failed to save settings", err.toString())
    }
}

module.exports = {
    loadSettings: loadSettings, 
    getSettings() {
        return {
            ...settings, 
            profiles: {
                ...settings.profiles, 
                [DEFAULT_PROFILE.name.toLowerCase()]: DEFAULT_PROFILE
            }
        };
    },
    addProfile(profile) {
        if (profile.name.toLowerCase() === 'default') return false;
        settings.profiles[profile.name.toLowerCase()] = profile;
        saveSettings();
        return true;
    },
    getDefaultProfile() {
        return DEFAULT_PROFILE;
    },
    removeProfile(name) {
        delete settings[name]
        saveSettings();
    },
    getActiveProfile() {
        if (settings.selected === DEFAULT_PROFILE.name.toLowerCase()) {
            return DEFAULT_PROFILE;
        }

        const profile = settings.profiles[settings.selected]

        if (!profile.name || !profile.authUrl || !profile.lobbyUrl) return DEFAULT_PROFILE;

        return profile
    },
    setActiveProfile(name) {
        if (!settings.profiles.hasOwnProperty(name)) return false;
        settings.selected = name;
        saveSettings();
        return true;
    }
}
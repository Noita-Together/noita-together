const { app } = require("electron")
const fs = require("fs")
const path = require("path")

const CONFIG_PATH = path.resolve(app.getPath("userData"), "config.json")

const DEFAULT_PROFILE = {
    name: "Default",
    authUrl: process.env.VUE_APP_NT_LOGIN_URL || "ENTER THE DEFAULT LOGIN URL",
    lobbyUrl: process.env.VUE_APP_LOBBY_SERVER_WS_URL_BASE || "ENTER THE DEFAULT LOBBY SERVER URL"
}

let settings = {
    selected: DEFAULT_PROFILE.name.toLowerCase(), 
    profiles: {}
}

function loadSettings() {
    try {
        const loadedSettings = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"))
        if (loadedSettings) settings = loadedSettings 
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
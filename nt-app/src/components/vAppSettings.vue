<template>
    <vModal>
        <h1 slot="header">App Settings</h1>
        <template slot="body" class="settings-body">
            <div class="profile-selector-container">
                <select
                    class="slot-selector"
                    v-model="tempSettings.selected"
                >
                    <option
                        v-for="profile in tempSettings.profiles"
                        :key="profile.name.toLowerCase()"
                        :value="profile.name.toLowerCase()"
                    >
                        {{ profile.name.toLowerCase() }} : {{ profile.authUrl }}
                    </option>
                </select>
                <vButton class="btn btn-normal" @click="showAddProfile = true">
                    <i slot="icon" class="fas fa-plus"></i>
                </vButton>
                <vButton class="btn btn-normal" @click="removeProfile">
                    <i slot="icon" class="fas fa-minus"></i>
                </vButton>
            </div>
            <div v-if="showAddProfile" class="new-profile">
                <vInput v-model="newProfile.name" label="name" />
                <vInput v-model="newProfile.authUrl" label="Auth URL" />
                <vInput v-model="newProfile.lobbyUrl" label="Lobby WS Server URL" />
                <div>
                    <vButton class="btn btn-normal" @click="addProfile">Add</vButton>
                    <vButton class="btn btn-normal" @click="addProfileCancel">Cancel</vButton>
                </div>
            </div>
        </template>
        <div slot="footer" class="centered">
            <vButton @click="applySettings" :disabled="showAddProfile">Apply</vButton>
            <vButton @click="close">Cancel</vButton>
        </div>
    </vModal>
</template>

<script>
// import vSwitch from "../components/vSwitch.vue"
import vModal from "../components/vModal.vue"
import vButton from "../components/vButton.vue"
// import vTooltip from "../components/vTooltip.vue"
import vInput from "../components/vInput.vue"
import { ipcRenderer } from "electron";

export default {
    //braincells where'd ya go
    name: "vAppSettings",
    components: {
        vButton,
        vModal,
        vInput,
        // vSwitch,
        // vTooltip
    },
    beforeCreate() {
        ipcRenderer.on("SETTINGS", (event, settings) => {
            this.tempSettings = settings;
        });
        ipcRenderer.send("GET_SETTINGS");
    },
    data() {
        return {
            tempSettings: {}, 
            showAddProfile: false, 
            newProfile: {
                name: "", 
                authUrl: "", 
                lobbyUrl: ""
            }
        }
    },
    computed: {
        isHost() {
            return this.$store.getters.isHost
        },
    },
    watch: {
        tempSettings() {
            console.log("temp setting watcher", this.tempSettings);
        }
    },
    methods: {
        applySettings() {
            ipcRenderer.send("SET_ACTIVE_PROFILE", this.tempSettings.selected);
            this.close();
        },
        close() {
            this.$emit("close");
        }, 
        // add the new profile, all inputs must have content
        addProfile() {
            ipcRenderer.send("ADD_PROFILE", this.newProfile);
            this.showAddProfile = false;
            this.newProfileReset();
        }, 
        // remove the currently selected profile, unless the selected profile is the default
        removeProfile() {
            ipcRenderer.send("REMOVE_PROFILE", this.tempSettings.selected);
        }, 
        // cancel the adding of a new profile
        addProfileCancel() {
            this.showAddProfile = false;

            this.newProfileReset();
        }, 
        // empty the new profile
        newProfileReset() {
            this.newProfile = {
                name: "", 
                authUrl: "", 
                lobbyUrl: ""
            };
        }, 
    }
}
</script>

<style>
.settings-body {
    display: flex;
    flex-direction: column;
    width: 100%;
}

.profile-selector-container {
    display: flex;
    flex-grow: 1;
}

.new-profile {
    display: flex;
    flex-direction: column;
    width: 100%;
}
</style>

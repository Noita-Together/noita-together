<template>
    <vModal>
        <h1 slot="header">App Settings</h1>
        <template slot="body" class="settings-body">
            <div class="profile-selector-container">
                <select
                    class="slot-selector"
                    v-model="tempSettings.selectedProfile"
                >
                    <option
                        v-for="(profile, index) in tempSettings.profiles"
                        :key="profile.name"
                        :value="index"
                    >
                        {{ profile.name }} : {{ profile.webApp }}
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
                <vInput v-model="newProfile.webApp" label="Web App URL" />
                <vInput v-model="newProfile.lobbyServer" label="Lobby WS Server URL" />
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
    beforeMount() {
        // create a "working copy" of the flags - so that we can cancel without
        // affecting the store
        // const obj = {}
        // for (const flag of this.$store.getters.flags) {
        //     obj[flag.id] = Object.assign({}, flag)
        // }
        this.tempSettings = this.$store.state.appSettings;
    },
    data() {
        return {
            tempSettings: null, 
            showAddProfile: false, 
            newProfile: {
                name: "", 
                webApp: "", 
                lobbyServer: ""
            }
        }
    },
    computed: {
        isHost() {
            return this.$store.getters.isHost
        },
    },
    methods: {
        applySettings() {
            this.$store.dispatch("updateAppSettings", this.tempSettings);
            this.close();
        },
        close() {
            this.$emit("close")
        }, 
        // add the new profile, all inputs must have content
        addProfile() {
            // input check
            if (!this.newProfile.name || !this.newProfile.webApp || !this.newProfile.lobbyServer) return;

            // hide inputs
            this.showAddProfile = false;
            // push new profile
            this.tempSettings.profiles.push(this.newProfile);
            // reset inputs
            this.newProfileReset();
            // update settings
            this.$store.dispatch("updateAppSettings", this.tempSettings);
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
                webApp: "", 
                lobbyServer: ""
            };
        }, 
        // remove the currently selected profile, unless the selected profile is the default
        removeProfile() {
            // do nothing if trying to delete the default profile
            if (this.tempSettings.selectedProfile === "Default") return;

            // otherwise, find and remove the current profile from the profiles array
            this.tempSettings.profiles.splice(
                this.tempSettings.profiles.findIndex((profile) => {
                    return profile.name === this.tempSettings.selectedProfile;
                }), 
                1
            );

            // if there is one profile left after deletion (the default), select it
            if (this.tempSettings.profiles.length === 1) {
                this.tempSettings.selectedProfile = this.tempSettings.profiles[0].name;
            }
        }
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

.switches {
    display: flex;
    flex-flow: row wrap;
}

.switches > div {
    padding: 0.2em;
    min-width: 180px;
}

span + .tooltip-wrapper {
    margin-left: 0.5em;
}
</style>

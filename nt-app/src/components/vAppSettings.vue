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
                        v-for="profile in tempSettings.profiles"
                        :key="profile.name"
                        :value="profile.name"
                    >
                        {{ profile.name }} : {{ profile.webApp }}
                    </option>
                </select>
                <button class="btn btn-normal" @click="addProfile">
                    <i slot="icon" class="fas fa-plus"></i>
                </button>
                <button class="btn btn-normal" @click="removeProfile">
                    <i slot="icon" class="fas fa-minus"></i>
                </button>
            </div>
        </template>
        <div slot="footer" class="centered">
            <vButton @click="applySettings">Apply</vButton>
            <vButton @click="close">Cancel</vButton>
        </div>
    </vModal>
</template>

<script>
import { ipcRenderer } from "electron";
// import vSwitch from "../components/vSwitch.vue"
import vModal from "../components/vModal.vue"
import vButton from "../components/vButton.vue"
// import vTooltip from "../components/vTooltip.vue"
// import vInput from "../components/vInput.vue"

export default {
    //braincells where'd ya go
    name: "vAppSettings",
    components: {
        vButton,
        vModal,
        // vInput,
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
        }
    },
    computed: {
        isHost() {
            return this.$store.getters.isHost
        },
    },
    methods: {
        applySettings() {

            // this.$emit("applySettings", Object.values(this.tempSettings))
        },
        close() {
            this.$emit("close")
        }, 
        saveSettings() {
            ipcRenderer.send("SAVE_SETTINGS", {"random": "random"});
        }, 
        addProfile() {
            
        }, 
        removeProfile() {

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

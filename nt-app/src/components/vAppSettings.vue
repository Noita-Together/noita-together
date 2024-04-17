<template>
    <vModal>
        <h1 slot="header">App Settings</h1>
        <template slot="body" class="settings-body">
            <select
                class="slot-selector"
                v-model="tempSettings.profile"
            >
                <option
                    v-for="(value, key) in profiles"
                    :key="key"
                    :value="key"
                >
                    {{ value.name }}
                </option>
            </select>
        </template>
        <div slot="footer" class="centered">
            <vButton @click="applySettings">Apply</vButton>
            <vButton @click="close">Cancel</vButton>
        </div>
    </vModal>
</template>

<script>
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
        const obj = {}
        // for (const flag of this.$store.getters.flags) {
        //     obj[flag.id] = Object.assign({}, flag)
        // }
        this.tempSettings = obj
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
            console.log('close');
            this.$emit("close")
        }
    }
}
</script>

<style>
.settings-body {
    display: flex;
    flex-flow: row wrap;
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

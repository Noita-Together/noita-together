<template>
    <vModal>
        <h1 slot="header">Game Options</h1>
        <template slot="body" class="flags-body">
            <h2>
                <span>Death Penalty</span>
                <vTooltip>
                    <span>{{ tooltip("NT_death_penalty", true) }}</span>
                </vTooltip>
            </h2>
            <select
                class="slot-selector"
                :disabled="!isHost"
                v-model="tempFlags.NT_death_penalty.value"
            >
                <option
                    v-for="(value, key) in deathFlags"
                    :key="key"
                    :value="key"
                >
                    {{ value.name }}
                </option>
            </select>

            <h2>Run Options</h2>
            <div class="switches">
                <vSwitch
                    v-for="entry in booleanFlags"
                    :key="entry.id"
                    v-model="tempFlags[entry.id].value"
                    :disabled="!isHost"
                >
                    <span>{{ flagInfo(entry.id).name }}</span>
                    <vTooltip>
                        <span>{{ tooltip(entry.id, false) }}</span>
                    </vTooltip>
                </vSwitch>
            </div>

            <h2>
                <span>World seed</span>
                <vTooltip>
                    <span>{{ tooltip("NT_sync_world_seed", false) }}</span>
                </vTooltip>
            </h2>
            <div class="world-seed">
                <vInput
                    :disabled="!isHost"
                    type="number"
                    v-model.number="tempFlags.NT_sync_world_seed.value"
                    ref="seedInput"
                ></vInput>
                <vButton :disabled="!isHost" @click="randomizeSeed"
                    >Random</vButton
                >
            </div>
        </template>
        <div slot="footer" class="centered">
            <vButton @click="applyFlags">Apply</vButton>
            <vButton @click="close">Cancel</vButton>
        </div>
    </vModal>
</template>

<script>
import vSwitch from "../components/vSwitch.vue"
import vModal from "../components/vModal.vue"
import vButton from "../components/vButton.vue"
import vTooltip from "../components/vTooltip.vue"
import vInput from "../components/vInput.vue"
import { flagInfo } from "../store/index.js"

export default {
    //braincells where'd ya go
    name: "vRoomFlags",
    components: {
        vButton,
        vModal,
        vInput,
        vSwitch,
        vTooltip
    },
    beforeMount() {
        // create a "working copy" of the flags - so that we can cancel without
        // affecting the store
        const obj = {}
        for (const flag of this.$store.getters.flags) {
            obj[flag.id] = Object.assign({}, flag)
        }
        this.tempFlags = obj
        this.gamemode = this.$store.getters.roomGamemode
    },
    data() {
        return {
            gamemode: null,
            tempFlags: null
        }
    },
    computed: {
        isHost() {
            return this.$store.getters.isHost
        },
        booleanFlags() {
            return Object.values(this.tempFlags).filter(
                (v) => v.type === "boolean"
            )
        },
        deathFlags() {
            return flagInfo[this.gamemode].NT_death_penalty
        }
    },
    methods: {
        flagInfo(id, val) {
            const gamemode = this.gamemode
            if (!Object.prototype.hasOwnProperty.call(flagInfo, gamemode)) {
                throw new Error(
                    "Invalid flagInfo call: gamemode " +
                        gamemode +
                        " not present"
                )
            }

            /** @type {import('../store/index.js').VueFlag|undefined} */
            const spec = this.tempFlags[id]
            if (!spec) {
                throw new Error(
                    "Invalid flagInfo call: id " + id + " not present"
                )
            }

            switch (spec.type) {
                case "string":
                case "number":
                case "boolean":
                    return flagInfo[gamemode][id]
                case "enum":
                    if (spec.choices.indexOf(val) === -1) {
                        throw new Error(
                            "Invalid flagInfo call: enum value " +
                                val +
                                " not present"
                        )
                    }
                    return flagInfo[gamemode][id][val]
            }
        },
        tooltip(id, isEnum) {
            if (!isEnum) {
                return this.flagInfo(id).tooltip
            }
            const enumValue = (this.tempFlags[id] || { value: null }).value
            return this.flagInfo(id, enumValue).tooltip
        },
        applyFlags() {
            this.$emit("applyFlags", Object.values(this.tempFlags))
        },
        randomizeSeed() {
            const seed = Math.floor(Math.random() * 4294967295) + 1
            // not an amazing way to do it
            this.$refs.seedInput.$refs.input.value = seed
            this.$refs.seedInput.$refs.input.dispatchEvent(new Event("input"))
        },
        close() {
            this.$emit("close")
        }
    }
}
</script>

<style>
.flags-body {
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

.world-seed {
    display: flex;
    width: 100%;
}

.world-seed .labeled-input {
    margin-top: auto;
    padding-bottom: 0;
    margin-right: 0;
}
span + .tooltip-wrapper {
    margin-left: 0.5em;
}
</style>

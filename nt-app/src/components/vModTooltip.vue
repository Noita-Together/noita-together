<template>
    <div class="info-wrapper">
        <div ref="content">
            <span>
                {{ modInfo.length }}
            </span>
        </div>
        <div class="info" ref="info">
            <div>
                <p>Users:</p>
                <p v-for="user in modInfo" :key="user">{{ user }}</p>
            </div>
        </div>
    </div>
</template>

<script>
import { createPopper } from "@popperjs/core";
export default {
    props: {
        mod: {
            type: String,
            required: true,
        },
    },
    computed: {
        modInfo(){
          const mods = {}
          this.$store.state.room.users.forEach(user=>{
            console.log(user)
            const userMods = user.mods ? user.mods : []
            userMods.forEach(mod=>{
              if(!Object.keys(mods).includes(mod))
                mods[mod] = []
              mods[mod].push(user.name)
            })
          })

          return mods[this.mod]
        },
        mode() {
            return this.$store.getters.roomGamemode;
        }
    },
    mounted() {
        if (this.$refs.info) {
            const content = this.$refs.content;
            this.tooltip = createPopper(content, this.$refs.info, {
                placement: "auto",
                modifiers: [{ name: "offset", options: { offset: [0, 20] } }],
            });
        }
    },
    beforeDestroy() {
        if (this.tooltip) {
            this.tooltip.destroy();
            this.tooltip = null;
        }
    },
};
</script>

<style>
.info-wrapper {
    display: inline;
}

.info-wrapper .info {
    visibility: hidden;
    background-color: #0e0e0e;
    color: rgba(255, 255, 255, 0.8);
    padding: 1em;
    border-radius: 3px;
}

.info-wrapper:hover .info {
    visibility: visible;
    opacity: 1;
}
</style>
<template>
    <div class="footer">
        <vAppSettings v-if="showAppSettings" @close="showAppSettings = false"/>
        <span id="app-version">v{{version}}</span>
        <div class="donate" @click="OpenContributors">
            <span title="Github">Click to see contributors <i slot="icon" class="fas fa-wrench"></i></span>
        </div>
        <div v-if="$route.fullPath === '/'" class="settings" @click="showAppSettings = true">
            <i slot="icon" class="fas fa-cog"></i>
        </div>
    </div>
</template>

<script>
import { shell, remote } from "electron";
import vAppSettings from "./vAppSettings.vue";
export default {
    name: "vFooter",
    components: {
        vAppSettings
    }, 
    beforeMount() {
        this.version = remote.app.getVersion()
    },
    data() {
        return {
            contributorUrl: "https://github.com/Noita-Together/noita-together/",
            version: "0", 
            showAppSettings: false, 
        }
    },
    methods: {
        OpenContributors() {
            shell.openExternal(this.contributorUrl);
        },
    }
};
</script>

<style>
.footer {
    display: flex;
    align-items: center;
    min-height: 32px;
    max-height: 32px;
    background-color: #2d2d2d;
}

#app-version {
    color: rgba(255, 255, 255, 0.4);
    margin-left: 0.5em;
    margin-right: auto;
}

.donate {
    cursor: pointer;
    margin-left: auto;
    margin-right: 0.5em;
}

.donate span, .donate span > i {
    color: rgba(255, 255, 255, 0.4);
}

.donate:hover *{
    color:white;
    transform: scale(1.2, 1.2);
    transition: all 0.2s;
}

.settings {
    cursor: pointer;
    margin-right: 0.5em;
}

.settings > i {
    color: rgba(255, 255, 255, 0.4);
}

.settings:hover *{
    color:white;
    transform: scale(1.2, 1.2);
    transition: all 0.2s;
}
</style>
<template>
    <div class="footer">
        <span id="app-version">v{{version}}</span>
        <span class="donate" @click="ShowHelpInBrowser">
          <span>FAQ <i slot="icon" class="fas fa-link"></i></span>
        </span>
        <div class="donate" @click="OpenContributors">
            <span title="Github">Click to see contributors <i slot="icon" class="fas fa-wrench"></i></span>
        </div>
    </div>
</template>

<script>
import { shell, remote } from "electron";
export default {
    name: "vFooter",
    beforeMount() {
        this.version = remote.app.getVersion()
    },
    data() {
        return {
            contributorUrl: "https://github.com/Noita-Together/noita-together/",
            faqUrl: "https://github.com/Noita-Together/noita-together/wiki/FAQ",
            version: "0"
        }
    },
    methods: {
        OpenContributors() {
            shell.openExternal(this.contributorUrl);
        },
        ShowHelpInBrowser() {
            shell.openExternal(this.faqUrl);
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
</style>
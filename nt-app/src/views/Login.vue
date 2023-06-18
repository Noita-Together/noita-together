<template>
  <div class="content">
    <div class="server-status" title="click to toggle offline mode" @click="ToggleOfflineMode">
      <div class="server-status-text">Server Status</div>
      <i v-if="isOnline !== null" class="fas fa-cloud" :class="{online: isOnline === true, offline: isOnline === false}"/>
      <i v-if="isOnline === null" class="fas fa-spin fa-spinner"/>
    </div>
    <div v-if="!renderOffline" class="twitch-login" :class="{ hax: !savedUser }" @click="OpenLoginPage">
      <div class="twitch-logo">
        <i class="fas fa-spinner fa-spin fa-pulse" v-if="clicked"></i>
        <i class="fab fa-twitch" v-else></i>
      </div>
      <span class="twitch-login-text">Login with Twitch.tv</span>
    </div>
    <div v-if="!renderOffline" class="remember-login">
      <input type="checkbox" id="remember-user" name="remember-user" v-model="remember" />
      <label for="remember-user">Remember me</label>
    </div>
    <div class="offline-buttons" v-if="renderOffline">
      <div class="host-lan-session" @click="StartStandaloneServer">
        <span class="lan-text">Host a LAN session</span>
      </div>
      <div class="join-lan-session">
        <span class="lan-text">Join a LAN session</span>
      </div>
    </div>


    <div class="twitch-login remembered-login" @click="ContinueSavedUser" v-if="savedUser && !renderOffline">
      <div class="twitch-logo">
        <i class="fab fa-twitch"></i>
      </div>
      <span class="twitch-login-text">Continue as {{ savedUserName }}</span>
    </div>
  </div>
</template>

<script>
import { shell, ipcRenderer } from "electron"
export default {
  data() {
    return {
      loginUrl: `${process.env.VUE_APP_HOSTNAME}/auth/login`,
      remember: false,
      clicked: false,
      renderOffline: false
    }
  },
  beforeCreate() {
    const unsub = this.$store.subscribe((mutation, state) => {
      if (mutation.type == "setUser" && state.user.id > 0) {
        unsub()
        this.clicked = false
        this.$router.replace({ path: "/lobby" })
        this.$store.commit("setLoading", false)
      }
    })
  },
  computed: {
    savedUser() {
      return this.$store.state.savedUser
    },
    isOnline(){
      return null
    },
    savedUserName() {
      return this.$store.state.savedUserName
    },
  },
  methods: {
    ToggleOfflineMode() {
      this.renderOffline = !this.renderOffline
    },
    OpenLoginPage() {
      this.clicked = true
      shell.openExternal(this.loginUrl)
    },
    ContinueSavedUser() {
      this.$store.dispatch("continueSavedUser")
    },
    StartStandaloneServer() {
      this.$store.dispatch("startStandaloneServer")
    },
  },
  watch: {
    remember(oldVal, newVal) {
      ipcRenderer.send("remember_user", !newVal)
    },
  },
}
</script>

<style>
.twitch-login.hax {
  margin-top: 40vh;
}
.twitch-login.remembered-login {
  margin-top: auto;
  align-self: stretch;
}

.twitch-login {
  display: flex;
  min-width: 300px;
  background-color: #6441a5;
  margin-top: auto;
  align-self: center;
  cursor: pointer;
}

.twitch-login:hover {
  background-color: #503484;
}

.twitch-login > div > i {
  font-size: 1.5rem;
}

.twitch-logo {
  padding: 1rem;
  background-color: #503484;
}

.twitch-login-text {
  margin: auto;
  align-self: center;
}

.remember-login {
  padding: 0.5rem;
  align-self: center;
}

.server-status{
  cursor: pointer;
  margin-top: 8px;
  width: 100%;
  justify-content: center;
  display: flex;
  gap: 8px;
}

.online{
  color: green;
}

.offline{
  color: red;
}

.server-status-text{
  margin-right: 8px;
}

.offline-buttons{
  margin: auto;
}

.join-lan-session{
  cursor: pointer;
  display: flex;
  margin: 8px auto;
  height: 50px;
  max-width: 90%;
  width: 300px;
  background: #2E2E2E;
}

.host-lan-session{
  cursor: pointer;
  display: flex;
  margin: 8px auto;
  height: 50px;
  max-width: 90%;
  width: 300px;
  background: #2E2E2E;
}

.host-lan-session:hover{
  background: #3b3b3b;
}

.join-lan-session:hover{
  background: #3b3b3b;
}

.lan-text{
  width: 100%;
  text-align: center;
  height: 50px;
  line-height: 50px;
  margin-right: auto;
  margin-left: auto;
}
</style>
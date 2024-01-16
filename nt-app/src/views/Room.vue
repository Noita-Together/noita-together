<template>
    <div class="content" id="room">
        <vRoomFlags v-if="showRoomFlags" @applyFlags="sendFlags" @close="closeRoomFlags" />
        <vLeaveRoom v-if="showLeaveModal" @close="closeLeaveModal" />

        <div class="room-header">
            <vButton @click="openLeaveRoom">
                <i class="fas fa-arrow-left" slot="icon"></i>
            </vButton>
            <h1>[{{ users.length }}/{{ room.maxUsers }}]{{ room.name }}</h1>
            <div class="room-edit">
                <vButton @click="lockRoom" :disabled="!isHost">
                    <i class="fas fa-lock" slot="icon" v-if="room.locked"></i>
                    <i class="fas fa-lock-open" slot="icon" v-else></i>
                </vButton>
                <vButton @click="openRoomFlags">
                    <template>
                        <i class="fas fa-edit" slot="icon" v-if="isHost"></i>
                        <i class="far fa-question-circle" slot="icon" v-else></i>
                    </template>
                </vButton>
            </div>
        </div>
        <div class="users-wrapper">
          <div class="tab-switcher" >
            <div v-for="(value, key) in tabs"
                 @click="openTab(key)"
                 v-bind:key="key"
                 class="tab"
                 :class="{ activeTab: tab===key, [tab]: true }"
            >
              {{value}}
            </div>
          </div>
          <!-- <div class="row-wrapper"> -->
          <div v-if="tab === '0' || !tab"> <!--Users tab-->
            <table>
              <thead>
              <tr class="pin-row">
                <th class="users-name">
                  <span>Name</span>
                  <img v-if="!sortByUser" title="sort by name" alt="Sort by name" class="users-sort" src="/sort_by_icon.svg" @click="sortUser()"/>
                  <img v-if="sortByUser" title="Sort by oldest to newest" alt="Sort by oldest to newest" class="users-sort" src="/sort_by_icon_active.svg" @click="sortUser()"/>
                </th>
                <th>Seed</th>
                <th>State</th>
                <th v-if="isHost">Actions</th>
              </tr>
              </thead>
              <tbody class="users-rows">
              <!-- <tbody> -->
              <tr v-for="user in users" :key="user.userId">
                <td>{{ user.name }}</td>
                <td>{{ user.seed }}</td>
                <td>
                  <vUserTooltip :userId="user.userId"></vUserTooltip>
                </td>
                <td v-if="isHost && user.userId !== userId">
                  <vButton @click="kick(user.userId)" size="btn-small">
                    <i class="fas fa-times" slot="icon"></i>
                    kick
                  </vButton>
                  <vButton @click="ban(user.userId)" size="btn-small">
                    <i class="fas fa-ban" slot="icon"></i>
                    ban
                  </vButton>
                </td>
                <td v-else-if="isHost">
                  <vButton @click="startRun(false)" size="btn-small">Start Run</vButton>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <div v-if="tab === '1'"> <!--Mods tab-->
            <table>
              <thead>
              <tr>
                <th class="tablist-row-top">
                  <div class="tablist-arrow-spacing"/>
                  <div class="tablist-col">Mod Name</div>
                  <div class="tablist-col-smol">Users</div>
                </th>
              </tr>
              </thead>
              <tbody>
                <tr v-for="mod in modList" :key="mod.name">
                  <td>
                    <div class="tablist-row" @click="toggleCollapse(mod.name)">
                      <i title="click to see users"
                          class="fas"
                          slot="icon"
                          :class="expandedItem === mod.name ? 'fa-chevron-up tablist-arrow-up' : 'fa-chevron-down tablist-arrow-down'"
                      />
                      <div class="tablist-col">{{ `${ mod.name.substring(0, 150)}${mod.name.length>150?'...':''}` }}</div>
                      <div class="tablist-col-smol">{{ mod.users.length }}</div>
                    </div>
                    <div v-if="expandedItem === mod.name">
                      <table class="tablist-users-table">
                        <tbody>
                        <tr v-for="user in mod.users" :key="user">
                          <vModUserTooltip :userId="user"></vModUserTooltip>
                        </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="tab === '2'"> <!--Seeds tab-->
            <table>
              <thead>
              <tr>
                <th class="tablist-row-top">
                  <div class="tablist-arrow-spacing"/>
                  <div class="tablist-col">Seed</div>
                  <div class="tablist-col-smol">Users</div>
                </th>
              </tr>
              </thead>
              <tbody>
                <tr v-for="seed in seedList" :key="seed.name">
                  <td>
                    <div class="tablist-row" @click="toggleCollapse(seed.name)">
                      <i title="click to see users"
                          class="fas"
                          slot="icon"
                          :class="expandedItem === seed.name ? 'fa-chevron-up tablist-arrow-up' : 'fa-chevron-down tablist-arrow-down'"
                      />
                      <div class="tablist-col">{{ seed.name }}</div>
                      <div class="tablist-col-smol">{{ seed.users.length }}</div>
                    </div>
                    <div v-if="expandedItem === seed.name">
                      <table class="tablist-users-table">
                        <tbody>
                        <tr v-for="user in seed.users" :key="user">
                          <td>{{ user }}</td>
                        </tr>
                        </tbody>
                      </table>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="chat-wrapper">
            <div class="chatbox" @keydown="sendChat">
                <vChatAutocomplete :items="autoData" v-model="chatMsg"></vChatAutocomplete> 
                <!-- <vChatAutocomplete :items="fakeUsernames" v-model="chatMsg"></vChatAutocomplete>  -->
            </div>
            <div class="room-chat" ref="chat" @scroll="handleScroll()">
                <template v-if="chat.length > 0">
                    <div v-for="(entry, index) in chat" :key="index" :class="entry.class">
                        <span class="chat-time" :style="{ color: entry.userId === '-1' ? entry.color : '#fff'}">[{{ entry.time }}]</span>
                        <span class="chat-name" :style="{ color: entry.color }">{{ entry.name }}</span>
                        <span class="chat-message" v-for="(span,j) in entry.spans" :key="j" :style="span.style">{{ span.message }}</span>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script>
import { ipcRenderer } from "electron"
import vButton from "@/components/vButton.vue"
import vRoomFlags from "@/components/vRoomFlags.vue"
import vLeaveRoom from "@/components/vLeaveRoom.vue"
//import vTooltip from "@/components/vTooltip.vue"
import vUserTooltip from "@/components/vUserTooltip.vue"
import vChatAutocomplete from "@/components/vChatAutocomplete.vue"
import vModUserTooltip from "@/components/vModUserTooltip.vue"
export default {
    components: {
        vButton,
        vRoomFlags,
        //vTooltip,
        vUserTooltip,
        vModUserTooltip,
        vChatAutocomplete,
        vLeaveRoom
    },
    data() {
        return {
            showRoomFlags: false,
            showLeaveModal: false,
            expandedContent: "",
            sortByUser: false,
            shouldScroll: true,
            chatMsg: "",
            lastMsg: Date.now(),
            locked: false
        }
    },
    beforeCreate() {
        const unsub = this.$store.subscribe((mutation) => {
            if (mutation.type == "resetRoom") {
                unsub()
                this.$router.replace({ path: "/lobby" })
            }
        })
    },
    created() {
        ipcRenderer.send("game_listen")
    },
    watch: {
        chat() {
            this.$nextTick(() => {
                if (this.shouldScroll) {
                  this.scrollToBottom();
                }
            })
        },
    },
    computed: {
        room() {
            return this.$store.state.room
        },
        flags() {
            return this.$store.state.roomFlags
        },
        chat() {
            return this.$store.state.roomChat
        },
        userId() {
            return this.$store.getters.userId
        },
        isHost() {
            return this.$store.getters.isHost
        },
        clientUser() {
            return this.$store.state.user
        },
        autoData() {
            return [{
                prefix: "@",
                names: this.$store.state.room.users.map(user => '@'+user.name),
            },
            {
                prefix: ":",
                names: this.modList.map(mod => ':'+mod.name.replace(/\s/g,'_')),
            }]
        },
        users() {
            const data = [
                ...this.$store.state.room.users
            ]
            if(!this.sortByUser) return data
            return [data[0], ...data.slice(1).sort((a, b) => {
              if(!a.name) return 1
              if(!b.name) return -1
              return a.name.toLowerCase() >= b.name.toLowerCase() ? 1 : -1
            })]
        },
        expandedItem(){
          return this.expandedContent
        },
        modList(){
            const mods = {}
            this.$store.state.room.users.forEach(user=>{
            //   console.log(user)
              const userMods = user.mods ? user.mods : []
              userMods.forEach(mod=>{
                if(!Object.keys(mods).includes(mod))
                  mods[mod] = []
                mods[mod].push(user.userId)
              })
            })

            const modNames = Object.keys(mods)
            return modNames.map((modName)=>({
              name: modName,
              users: mods[modName]
            })).sort((a,b)=>{
              const aUsers = a.users.length
              const bUsers = b.users.length

              if(aUsers === bUsers){
                return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
              }
              return aUsers > bUsers ? -1 : 1
            })
        },
        seedList(){
            const seeds = {}
            this.$store.state.room.users.forEach(user=>{
                // console.log(user)
                const userSeed = user.seed ? user.seed : "Not Ready"
                if(!Object.keys(seeds).includes(userSeed))
                    seeds[userSeed] = []
                seeds[userSeed].push(user.name)
            })

            const seedNums = Object.keys(seeds)
            return seedNums.map((seedNum)=>({
                name: seedNum,
                users: seeds[seedNum]
            })).sort((a,b)=>{
                const aUsers = a.users.length
                const bUsers = b.users.length

                if(aUsers === bUsers){
                    return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
                }
                return aUsers > bUsers ? -1 : 1
            })
        },
        tab(){
            return this.$store.state.roomTab
        },
        tabs(){
            return this.$store.state.tabs
        }
    },
    methods: {
        handleScroll() {
            const chatBox = this.$refs.chat;
            const scrollTop = chatBox.scrollTop;
            const scrollHeight = chatBox.scrollHeight;
            const clientHeight = chatBox.clientHeight;
            const scrollThreshold = 100; // Adjust the threshold as needed

            this.shouldScroll = scrollHeight - scrollTop - clientHeight < scrollThreshold;
        },
        scrollToBottom() {
            this.$refs.chat.scrollTop = this.$refs.chat.scrollHeight;
        },
        lockRoom() {
            this.$store.dispatch("updateRoom", { locked: !this.room.locked })
        },
        setTab(tab) {
            this.$store.dispatch("updateTab", tab)
        },
        sendChat(e) {
            if (e.key != "Enter" || !this.chatMsg.trim()) {
                return
            }
            if (Date.now() - this.lastMsg < 400) {
                this.$store.dispatch("sendClientAlert", { message: "You are being rate limited!" })
                return
            }
            if(this.chatMsg.length > 500){
              this.$store.dispatch("sendClientAlert", { message: "Message too long! Try again with less than 500 characters!" })
              return
            }
            this.$store.dispatch("sendChat", { message: this.chatMsg.trim() })
            this.lastMsg = Date.now()
            this.chatMsg = ""
        },
        sendFlags(payload) {
            this.$store.commit("cRoomFlagsUpdated", payload)
            this.$store.dispatch("sendFlags")
            this.closeRoomFlags()
        },
        openRoomFlags() {
            this.showRoomFlags = true
        },
        closeRoomFlags() {
            this.showRoomFlags = false
        },
        openLeaveRoom() {
            this.showLeaveModal = true
        },
        toggleCollapse(name){
            this.expandedContent = this.expandedContent === name ? "" : name
        },
        openTab(tab){
            this.setTab(tab)
        },
        sortUser(){
          this.sortByUser = !this.sortByUser
        },
        closeLeaveModal() {
            this.showLeaveModal = false
        },
        kick(userId) {
            this.$store.dispatch("kickUser", { userId })
        },
        ban(userId) {
            this.$store.dispatch("banUser", { userId })
        },
        startRun(forced) {
            this.$store.dispatch("startRun", { forced })
        }
    },
}
</script>

<style>
.room-header {
    display: flex;
    width: 100%;
    height: 3em;
    margin-bottom: 0.5em;
}

.users-wrapper {
    width: 100%;
    margin-bottom: 1em;
    overflow: auto;
    overflow-x: hidden;
}

.users-name{
    display: flex;
}

.users-sort{
    cursor: pointer;
    margin-left: 8px;
    width: 20px;
    height: 20px;
    object-fit: contain;
}

.tab-switcher{
    display: flex;
    overflow: hidden;
    position: sticky;
    top: 0;
    background: #1d1d1d;
}

.tab{
    margin-right: 8px;
    background: #808080;
    padding: 4px 8px 4px;
}

.tab:hover{
    background: #666666;
}

.activeTab{
    background: #2e2e2e !important;
}

.tablist-row-top{
    width: 100%;
    justify-content: space-between;
    display: flex;
    position: sticky;
    top: 1.6em;
}

.pin-row > th{
    position: sticky;
    top: 1.6em
}

.users-rows tr:first-child > td{
    top: 4.4em;
    background-color: #1D1D1D;
}

.tablist-row{
    width: 100%;
    justify-content: space-between;
    display: flex;
}

.tablist-col{
    width: 80%;
}

.tablist-col-smol{
    width: 20%;
    justify-content: center;
    text-align: center;
}

.tablist-users-table{
    border: 1px solid #2E2E2E;
    width: 60%;
    margin-top: 8px;
    margin-left: 32px;
}

.tablist-arrow-spacing{
    width: 20px;
}

.tablist-arrow-down{
    margin-right: 8px;
}

.tablist-arrow-up{
    margin-right: 8px;
}

.room-header > h1 {
    padding: 0.2em;
    margin: 0;
    margin-left: auto;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.room-edit {
    margin-left: auto;
}

.chatbox {
    display: flex;
    width: 100%;
}

.chat-wrapper {
    display: flex;
    flex-direction: column-reverse;
    width: 100%;
    max-height: 40%;
    min-height: 40%;
    margin-top: auto;
}
.room-chat {
    padding: 0.5em;
    background: rgb(40, 40, 40);
    display: flex;
    flex-direction: column;
    overflow-wrap: break-word;
    overflow: auto;
    overflow-x: hidden;
    height: 100%;
}

.chat-entry {
    padding: 0.25em 0.1em;
    overflow-y: hidden;
    min-height: fit-content;
}

.chat-entry:hover {
    background: rgba(58, 58, 58, 0.5);
}
.mention {
    margin-bottom: 0.2em;
    padding: 0.2em 0.1em;
    border: 0.1em solid gold;
    box-sizing: border-box;
    overflow-y: hidden;
    min-height: fit-content;
}

.mention:hover {
    background: rgba(58, 58, 58, 0.5); 
}

.chat-entry > p {
    display: inline-block;
}

.chat-time {
    font-weight: 500;
    margin-right: 0.3em;
}

.chat-name {
    font-weight: 600;
    margin-right: 0.3em;
}
.chat-name::after {
    content: ":";
}

@media only screen and (min-width: 900px) {
    .room-header {
        flex-shrink: 0;
    }
    .chat-wrapper {
        display: flex;
        margin: 0;
        flex-direction: column-reverse;
        width: 50%;
        max-height: 90%;
        height: 90%;
        margin-left: auto;
    }

    .users-wrapper {
        width: 50%;
        max-height: 90%;
        margin-bottom: 0;
    }

    #room {
        flex-flow: row wrap;
    }
}

.user-ready {
    color: #acff2f;
}

.user-not-ready {
    color: #ff2f2f;
}

.users-wrapper table td:nth-child(1n + 0) {
    width: 40%;
}

.users-wrapper table td:nth-child(2n + 0) {
    width: 15%;
}

.users-wrapper table td:nth-child(3n + 0) {
    width: 15%;
}
.users-wrapper table td:nth-child(4n + 0) {
    width: 30%;
}
</style>
<template>
    <div class="content" id="room">
        <vRoomFlags
            v-if="showRoomFlags"
            @applyFlags="sendFlags"
            @close="closeRoomFlags" />
        <vLeaveRoom
            v-if="showLeaveModal"
            @close="closeLeaveModal" />

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
                  <i class="fas fa-edit" slot="icon" v-if="isHost"></i>
                  <i class="far fa-question-circle" slot="icon" v-else></i>
                </vButton>
            </div>
        </div>
        <div class="users-wrapper">
          <div class="tab-switcher" >
            <div v-for="value in tabs"
                 @click="openTab(RoomTabToId[value])"
                 v-bind:key="RoomTabToId[value]"
                 class="tab"
                 :class="{ activeTab: tab===RoomTabToId[value], [tab]: true }"
            >
              {{value}}
            </div>
          </div>
          <!-- <div class="row-wrapper"> -->
          <div v-if="tab === 0 || !tab"> <!--Users tab-->
            <table>
              <thead>
              <tr>
                <th>Name</th>
                <th>State</th>
                <th v-if="isHost">Actions</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="user in users" :key="user.userId">
                <td>{{ user.name }}</td>
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
          <div v-if="tab === 1"> <!--Mods tab-->
            <table>
              <thead>
              <tr>
                <th class="modlist-row">
                  <div class="modlist-arrow-spacing"/>
                  <div class="modlist-col">Mod Name</div>
                  <div class="modlist-col-smol">Users</div>
                </th>
              </tr>
              </thead>
              <tbody>
                <tr v-for="mod in modList" :key="mod.name">
                  <td>
                    <div class="modlist-row" @click="toggleCollapse(mod.name)">
                      <i title="click to see users"
                          class="fas"
                          slot="icon"
                          :class="expandedContent === mod.name ? 'fa-chevron-up modlist-arrow-up' : 'fa-chevron-down modlist-arrow-down'"
                      />
                      <div class="modlist-col">{{`${mod.name.substring(0, 600)}${mod.name.length>600?'...':''}`}}</div>
                      <div class="modlist-col-smol">{{mod.users.length}}</div>
                    </div>
                    <div v-if="expandedContent === mod.name">
                      <table class="modlist-users-table">
                        <tbody>
                        <tr v-for="user in mod.users" :key="user">
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
                <input type="text" v-model="chatMsg" placeholder="Send Message" />
            </div>
            <div class="room-chat" ref="chat">
                <template v-if="chat.length > 0">
                    <div class="chat-entry" v-for="(entry, index) in chat" :key="index">
                        <span class="chat-time">[{{ entry.time }}]</span>
                        <span class="chat-name" :style="{ color: entry.color }">{{ entry.name }}</span>
                        <span class="chat-message">{{ entry.message }}</span>
                    </div>
                </template>
            </div>
        </div>
        <!-- </div> -->
    </div>
</template>

<script setup lang="ts">
import { ipcRenderer } from "electron";
import vButton from "../components/vButton.vue";
import vRoomFlags from "../components/vRoomFlags.vue";
import vLeaveRoom from "../components/vLeaveRoom.vue";
import vUserTooltip from "../components/vUserTooltip.vue";
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { useRouter } from "vue-router";
import useStore, {GameFlag, RoomTabToId} from "../store";
import { ipc } from "../ipc-renderer";
const router = useRouter();
const store = useStore();

const showRoomFlags = ref(false);
const showLeaveModal = ref(false);
const expandedContent = ref('')
const chatMsg = ref("");
const lastMsg = ref(Date.now());
const tab = ref(RoomTabToId.users)

watch(
    () => store.state.room.id,
    (id) => {
      if (!id) {
        router.replace({ path: "/lobby" });
      }
    }
);
onMounted(() => {
  ipcRenderer.send("game_listen");
});

const room = computed(() => {
  return store.state.room;
});
const chat = computed(() => {
  return store.state.roomChat;
});
const userId = computed(() => {
  return store.getters.userId;
});
const isHost = computed(() => {
  return store.getters.isHost;
});
const users = computed(() => {
  return store.state.room.users;
});
const tabs = computed(():string[]=>{
  return Object.keys(RoomTabToId)
})
const modList = computed(()=>{
  const mods = {} as {[key: string]: any}
  store.state.room.users.forEach((user:any)=>{
    console.log(user)
    const userMods = user.mods ? user.mods : []
    userMods.forEach((mod :string)=>{
      if(!Object.keys(mods).includes(mod))
        mods[mod] = []
      mods[mod].push(user.name)
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
})

const chatElement = ref();
watch(chat, (chat) => {
  nextTick(() => {
    if (chatElement.value) {
      if (chatElement.value.scrollHeight - chatElement.value.scrollTop < 700) {
        chatElement.value.scrollTop = chatElement.value.scrollHeight;
      }
    }
  });
});
function lockRoom() {
  store.actions.updateRoom({
    locked: !room.value.locked,
  });
}
async function saveGame() {
  const gameSave = await ipc.callMain("saveGame")();
  if (gameSave.success) {
    store.dispatch("sendChat", { message: "Game saved" });
  } else {
    store.dispatch("sendChat", { message: "Game save failed" });
  }
}
function sendChat(e: KeyboardEvent) {
  if (e.key != "Enter" || !chatMsg.value.trim()) {
    return;
  }
  if (Date.now() - lastMsg.value < 400) {
    console.log("TOO FAST MANG");
    return;
  }
  store.dispatch("sendChat", { message: chatMsg.value.trim() });
  lastMsg.value = Date.now();
  chatMsg.value = "";
}
function toggleCollapse(modName: string){
  expandedContent.value = expandedContent.value === modName ? "" : modName
}
function openTab(id:number) {
  tab.value = id
}

function sendFlags(payload: GameFlag[]) {
  store.actions.updateRoomFlags(payload);
  store.actions.sendFlags();
  closeRoomFlags();
}
function openRoomFlags() {
  showRoomFlags.value = true;
}
function closeRoomFlags() {
  showRoomFlags.value = false;
}
function openLeaveRoom() {
  showLeaveModal.value = true;
}
function closeLeaveModal() {
  showLeaveModal.value = false;
}
function kick(userId: string) {
  store.actions.kickUser({
    userId,
  });
}
function ban(userId: string) {
  store.actions.banUser({
    userId,
  });
}
function startRun(forced: boolean) {
  store.actions.startRun({
    forced,
  });
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

.tab-switcher{
  display: flex;
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

.modlist-row{
  width: 100%;
  justify-content: space-between;
  display: flex;
}

.modlist-col{
  flex-grow: 1;
}

.modlist-col-smol{
  width: 300px;
  justify-content: center;
  text-align: center;
}

.modlist-users-table{
  border: 1px solid #2E2E2E;
  width: 60%;
  margin-top: 8px;
  margin-left: 32px;
}

.modlist-arrow-spacing{
  width: 20px;
}

.modlist-arrow-down{
  margin-right: 8px;
}

.modlist-arrow-up{
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

.chatbox > input {
    margin: 0;
    padding: 0.5em;
    width: 100%;
    background: transparent;
    border: none;
    background: rgb(34, 34, 34);
    transition: all 0.2s;
}

.chatbox > input:focus {
    box-shadow: none;
    outline: none;
    background-position: 0 0;
    background: rgb(14, 14, 14);
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
    padding-bottom: 0.5em;
}

.chat-entry:hover {
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
    width: 50%;
}

.users-wrapper table td:nth-child(2n + 0) {
    width: 20%;
}

.users-wrapper table td:nth-child(3n + 0) {
    width: 30%;
}
</style>
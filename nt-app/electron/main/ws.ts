import { v4 as uuidv4 } from "uuid";
import { ipcMain } from "electron";
import { ipc } from "./ipc-main";
import ws from "ws";
import { appEvent } from "./appEvent";
import noita from "./noita";
import { getDb } from "./database";
import {globalAPI} from "../../src/util/ApiUtil";
import messageHandler from "nt-server/src/messageHandler";
import {NT} from "nt-server/src/messages";
const host = globalAPI.getWSUrl();

export interface OfflineOptions{
  code: string
  username: string
}

export interface WsOptions{
  offline?: OfflineOptions
}

export default (data: any, options: WsOptions) => {
  const user = { userId: data.id, name: data.display_name };
  noita.setUser({ userId: user.userId, name: user.name, host: false });
  let isHost = false; // TODO: Use noita.isHost() instead
  let client: ws | null = new ws(options.offline ? `${host}offline/${options.offline.code}/${options.offline.username}` : `${host}${data.token}`);
  const lobby: {
    [key in keyof NT.ILobbyAction]: (
      payload: NonNullable<NT.ILobbyAction[key]> // TODO: Change protobuf stuff so that this NonNullable is not necessary
    ) => void | Promise<void>;
  } = {
    sHostStart: (payload) => {
      if (isHost) {
        const bank = noita.getBank();
        const msg = messageHandler.encodeGameMsg("cHostItemBank", {
          wands: bank?.wands,
          spells: bank?.spells,
          items: bank?.flasks,
          objects: bank?.objects,
          gold: bank?.gold,
        });
        sendMsg(msg);
      }
      noita.sendEvt("StartRun");
    },
    sUserBanned: async (payload) => {
      if (payload.userId == user.userId) {
        await noita.reset();
      } else {
        noita.removePlayer(payload);
      }
    },
    sUserKicked: async (payload) => {
      if (payload.userId == user.userId) {
        await noita.reset();
      } else {
        noita.removePlayer(payload);
      }
    },
    sUserLeftRoom: async (payload) => {
      if (payload.userId == user.userId) {
        await noita.reset();
      } else {
        noita.removePlayer(payload);
      }
    },
    sUserJoinedRoom: (payload) => {
      noita.addPlayer(payload);
    },
    sJoinRoomSuccess: (payload) => {
      noita.rejectConnections = false;
      noita.startGame(uuidv4());
      if(!payload.users) {
        console.error('sJoinRoomSuccess: No users!')
        return
      }
      for (const player of payload.users) {
        if (player.userId == user.userId) {
          continue;
        }
        noita.addPlayer({ userId: player.userId, name: player.name });
      }
    },
    sRoomFlagsUpdated: (payload) => {
      if(payload.flags) noita.updateFlags(payload.flags);
    },
    sRoomCreated: (payload) => {
      if (!payload) {
        console.error("sRoomCreated payload is null");
        return;
      }
      noita.rejectConnections = false;
      noita.startGame(uuidv4());
      noita.setHost(true);
      isHost = true;
    },
    sRoomDeleted: async (payload) => {
      await noita.reset();
    },
  };

  client.on("open", () => {
    appEvent("CONNECTED", data);
  });

  client.on("close", () => {
    appEvent("CONNECTION_LOST", null);
    client?.terminate();
    client = null;
  });

  // We know it's an Uint8Array, because we're using that binary type
  client.on("message", (data: Uint8Array) => {
    try {
      const { gameAction, lobbyAction } = messageHandler.decode(data);
      let payload;
      let key: string|undefined;
      if (gameAction) {
        noita.handleGameAction(gameAction);
      } else if (lobbyAction) {
        key = Object.keys(lobbyAction).shift();
        if(key === undefined) return
        payload = lobbyAction[key];
        if (key && payload) {
          if (typeof lobby[key] == "function") {
            lobby[key](payload);
          }
          appEvent(key, payload);
        }
      }
      //if (["sPlayerMove", "sPlayerUpdate", "sChat"].indexOf(key) > -1) { return }
      //console.log(`[SERVER ${key}]`)
      //console.log(payload)
      //console.log()
    } catch (error) {
      //eugh
      console.error("something went wrong while getting the message", error);
    }
  });

  ipc.answerRenderer("clientMessage", async (data) => {
    const msg = messageHandler.encodeLobbyMsg(data.key, data.payload);
    sendMsg(msg);
  });

  ipc.answerRenderer("saveGame", async (data) => {
    return {
      success: await noita.saveGame(),
    };
  });

  ipc.answerRenderer("getGameSaveFull", async (data) => {
    const db = await getDb();
    return db.data.games.find((v) => v.id === data) ?? null;
  });

  ipc.answerRenderer("loadSavedGame", async (data) => {
    const db = await getDb();
    const savedGame = db.data.games.find((v) => v.id === data) ?? null;
    if (!savedGame) {
      return { success: false };
    }

    const success = noita.loadSavedGame(savedGame);
    return { success };
  });

  ipcMain.on("CLIENT_CHAT", (e, data) => {
    const msg = messageHandler.encodeGameMsg(data.key, data.payload);
    sendMsg(msg);
  });

  noita.on("death_kick", (userId) => {
    const msg = messageHandler.encodeLobbyMsg("cKickUser", { userId });
    sendMsg(msg);
  });

  noita.on("GAME_OPEN", () => {
    noita.sendEvt("RequestGameInfo");
    noita.sendEvt("RequestSpellList");

    noita.once("GameInfo", (event) => {
      const msg = messageHandler.encodeLobbyMsg("cReadyState", {
        ready: true,
        seed: event.seed,
        mods: event.mods,
        version: event.version,
        beta: event.beta,
      });
      sendMsg(msg);
    });
  });

  noita.on("GAME_CLOSE", () => {
    unready();
  });

  noita.on("PlayerMove", (event) => {
    const msg = messageHandler.encodeGameMsg("cPlayerMove", event);
    sendMsg(msg);
  });

  noita.on("PlayerUpdate", (event) => {
    const msg = messageHandler.encodeGameMsg("cPlayerUpdate", event);
    sendMsg(msg);
  });

  noita.on("PlayerPickup", (event) => {
    const msg = messageHandler.encodeGameMsg("cPlayerPickup", event);
    sendMsg(msg);
  });

  noita.on("PlayerDeath", (event) => {
    const msg = messageHandler.encodeGameMsg("cPlayerDeath", event);
    sendMsg(msg);
    unready();
  });

  noita.on("RunOver", () => {
    unready();
    if (isHost) {
      const msg = messageHandler.encodeLobbyMsg("cRunOver", { idk: false });
      sendMsg(msg);
    }
  });

  noita.on("SendGold", (event) => {
    const msg = messageHandler.encodeGameMsg("cPlayerAddGold", event);
    sendMsg(msg);
  });

  noita.on("TakeGold", (event) => {
    const msg = messageHandler.encodeGameMsg("cPlayerTakeGold", event);
    sendMsg(msg);
  });

  noita.on("AngerySteve", (event) => {
    const msg = messageHandler.encodeGameMsg("cAngerySteve", event);
    sendMsg(msg);
  });

  noita.on("RespawnPenalty", (event) => {
    const msg = messageHandler.encodeGameMsg("cRespawnPenalty", event);
    sendMsg(msg);
  });

  noita.on("SendItems", (event) => {
    const payload: {
      spells?: {list:any}
      flasks?: {list:any}
      wands?: {list:any}
      objects?: {list:any}
    } = {};
    if (event.spells) {
      const spells = event.spells.map(mapSpells);
      payload.spells = { list: spells };
    } else if (event.flasks) {
      const flasks = event.flasks.map(mapFlasks);
      payload.flasks = { list: flasks };
    } else if (event.wands) {
      const wands = event.wands.map(mapWands);
      payload.wands = { list: wands };
    } else if (event.objects) {
      const objects = event.objects.map(mapObjects);
      payload.objects = { list: objects };
    }
    const msg = messageHandler.encodeGameMsg("cPlayerAddItem", payload);
    sendMsg(msg);
  });

  noita.on("PlayerTake", (event) => {
    const msg = messageHandler.encodeGameMsg("cPlayerTakeItem", event);
    sendMsg(msg);
  });

  noita.on("HostTake", (event) => {
    const msg = messageHandler.encodeGameMsg("cHostUserTake", event);
    sendMsg(msg);
  });

  noita.on("HostTakeGold", (event) => {
    const msg = messageHandler.encodeGameMsg("cHostUserTakeGold", event);
    sendMsg(msg);
  });

  noita.on("CustomModEvent", (event) => {
    const payload = JSON.stringify(event);
    const msg = messageHandler.encodeGameMsg("cCustomModEvent", { payload });
    sendMsg(msg);
  });

  function sendMsg(msg: any) {
    if (client != null) {
      client.send(msg);
    }
  }

  function unready() {
    const msg = messageHandler.encodeLobbyMsg("cReadyState", {
      ready: false,
      seed: "",
      mods: [],
    });
    sendMsg(msg);
  }

  function mapWands(wand:any) { //TODO define wand
    return {
      id: uuidv4(),
      stats: keysToCamel(wand.stats),
      alwaysCast: wand.always_cast
        ? wand.always_cast.map(mapSpells)
        : undefined,
      deck: wand.deck.map(mapSpells),
      sentBy: user.userId,
    };
  }

  function mapSpells(spell: any) { //TODO define spell
    return {
      id: uuidv4(),
      gameId: spell.id,
      usesRemaining: spell.usesRemaining,
      sentBy: user.userId,
    };
  }

  function mapFlasks(val: any) { //TODO define flask
    return {
      id: uuidv4(),
      isChest: val.isChest,
      color: {
        r: (val.color & 0xff) / 193,
        g: ((val.color >> 8) & 0xff) / 193.5,
        b: ((val.color >> 16) & 0xff) / 193,
      },
      content: val.content,
      sentBy: user.userId,
    };
  }

  function mapObjects(val: any) { //TODO define object
    return {
      id: uuidv4(),
      path: val.path,
      sprite: val.sprite,
      sentBy: user.userId,
    };
  }

  function toCamel(str: string) {
    return str.replace(/([_][a-z])/gi, ($1) => {
      return $1.toUpperCase().replace("_", "");
    });
  }

  function keysToCamel(obj: { [key: string]: any }) {
    const n: { [key: string]: any } = {};
    for (const key of Object.keys(obj)) {
      n[toCamel(key)] = obj[key];
    }
    return n;
  }
};

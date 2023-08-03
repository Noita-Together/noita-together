dofile( "data/scripts/perks/perk.lua" )
dofile( "mods/noita-together/files/scripts/hourglass_events.lua")

customEvents = {
    PlayerPOI = function(data)
        local user = PlayerList[data.userId]
        if (user == nil) then
            return nil
        end
        SpawnPoi(user.name .. "'s message", data.message, data.x, data.y)
    end,
    FungalShift = function(data)
        if(GameHasFlagRun("NT_GAMEMODE_CO_OP") and GameHasFlagRun("NT_sync_shift")) then
            DoFungalShift(data.from, data.to)
        end
    end,
    TeamPerk = function(data)
        local list = dofile("mods/noita-together/files/scripts/perks.lua")
        if (not GameHasFlagRun("NT_GAMEMODE_CO_OP") or (not GameHasFlagRun("NT_sync_perks") and not GameHasFlagRun("NT_team_perks"))) then 
            return nil
        elseif (GameHasFlagRun("NT_team_perks") and not GameHasFlagRun("NT_sync_perks") and (list[data.id] == false or list[data.id] == nil)) then
            return nil
        end
        local user = PlayerList[data.userId]
        if (user ~= nil) then
            GamePrintImportant(GameTextGet("$noitatogether_teamperk_received_title", user.name), "$noitatogether_teamperk_received_subtitle")
        end
        local player = GetPlayer()
        local x, y = GetPlayerPos()
        if (player ~= nil) then
            local perk_entity = perk_spawn(x, y - 8, data.id)
            if (perk_entity ~= nil) then
                perk_pickup(perk_entity, player, nil, true, false)
            end
        end
    end,
    SampoPickup = function (data)
        local player = PlayerList[data.userId].name
        if (player ~= nil) then
            PlayerList[data.userId].sampo = true
        end
        NT.players_sampo = NT.players_sampo + 1
        
        --Populate this with the particular version they actually got, for flexing purposes :)
        local orbs = data.orbs or 0
        local orbs_for_name = orbs

        if( orbs_for_name < 0 ) then
            orbs_for_name = 0
        elseif ( orbs_for_name > 33 ) then
            orbs_for_name = 33
        elseif( orbs_for_name > 13 ) then --nothing between 13 and 33
            orbs_for_name = 13
        end

        local sampo_message = nil
        if orbs >= 13 then --show exact orb count, no longer uniquely named
            sampo_message = GameTextGet("$noitatogether_player_got_mcguffin_orbs", player, GameTextGet("$item_mcguffin_" .. tostring(orbs_for_name)), tostring(orbs))
        else
            sampo_message = GameTextGet("$noitatogether_player_got_mcguffin", player, GameTextGet("$item_mcguffin_" .. tostring(orbs_for_name)))
        end
        GamePrint(sampo_message)
    end,
    PlayerMove = function(data)
        --[[
        local md = GetStuff(ConvertStrToTable(data.movement))
        if (md ~= nil) then
            PlayerList[data.userId].x = md.x
            PlayerList[data.userId].y = md.y
            PlayerList[data.userId].scale_x = md.scaleX
            MovePlayerGhost(data)
        end
        ]]
    end,
    PlayerInven = function(data)
        local inven = jankson.decode(data.inven)
        PlayerList[data.userId].inven = inven
        data.inven = inven
        UpdatePlayerGhost(data)
    end,
    PlayerCosmeticFlags = function(data)
        UpdatePlayerGhostCosmetic(data)
    end,
    SecretHourglass = HandleHourglassEvent,
    --[[ function (data)
        local player = GetPlayer()
        local player_name = PlayerList[data.userId].name
        
        if (data.effect == "ambrosia") then
            local x, y = GetPlayerOrCameraPos()
            local effect_entity = EntityLoad("mods/noita-together/files/effects/weak_ambrosia.xml", x, y)
            EntityAddChild(player, effect_entity)
            EntityAddComponent2(effect_entity, "UIIconComponent", {
                icon_sprite_file = "data/ui_gfx/status_indicators/protection_all.png",
                name = GameTextGet("$noitatogether_hourglass_buff_protection_name"),
                description = GameTextGet("$noitatogether_hourglass_buff_protection_desc", player_name),
                display_above_head = true,
                display_in_hud = true,
                is_perk = false
            })
            GamePrintImportant(GameTextGet("$noitatogether_hourglass_boost_title", player_name), "$noitatogether_hourglass_ambrosia_subtitle")
        elseif (data.effect == "berserk") then
            local effect_comp = EntityGetFirstComponent(effect_entity, "GameEffectComponent")
            ComponentSetValue2(effect_comp, "frames", 60*120)
            EntityAddComponent2(effect_entity, "UIIconComponent", {
                icon_sprite_file = "data/ui_gfx/status_indicators/berserk.png",
                name = GameTextGet("$noitatogether_hourglass_buff_damage_name"),
                description = GameTextGet("$noitatogether_hourglass_buff_damage_desc", player_name),
                display_above_head = true,
                display_in_hud = true,
                is_perk = false
            })
            GamePrintImportant(GameTextGet("$noitatogether_hourglass_boost_title", player_name), "$noitatogether_hourglass_berserk_subtitle")
        elseif (data.effect == "charm") then
            local x, y = GetPlayerOrCameraPos()
            EntityLoad("data/entities/projectiles/deck/regeneration_field_long.xml", x, y)
            GamePrintImportant(GameTextGet("$noitatogether_hourglass_boon_title", player_name), "")
        elseif (data.effect == "confusion") then
            local fungi = CellFactory_GetType("fungi")
            if (player ~= nil) then
                EntityIngestMaterial( player, fungi, 300 )
                local stomach = EntityGetFirstComponent(player, "IngestionComponent")
                if (stomach ~= nil) then
                    local ingestion_size = ComponentGetValue2(stomach, "ingestion_size")
                    ComponentSetValue2(stomach, "ingestion_size", math.max(0, ingestion_size - 300))
                end
                GamePrintImportant(GameTextGet("$noitatogether_hourglass_fungus_title", player_name), "$noitatogether_hourglass_fungus_subtitle_yes")
            else
                GamePrintImportant(GameTextGet("$noitatogether_hourglass_fungus_title", player_name), "$noitatogether_hourglass_fungus_subtitle_no")
            end
        elseif (data.effect == "speed") then
            local effect_entity = LoadGameEffectEntityTo(player, "data/entities/misc/effect_movement_faster.xml")
            local effect_comp = EntityGetFirstComponent(effect_entity, "GameEffectComponent")
            ComponentSetValue2(effect_comp, "frames", 60*45)
            EntityAddComponent2(effect_entity, "UIIconComponent", {
                icon_sprite_file = "data/ui_gfx/status_indicators/movement_faster.png",
                name = GameTextGet("$noitatogether_hourglass_buff_speed_name"),
                description = GameTextGet("$noitatogether_hourglass_buff_speed_desc", player_name),
                display_above_head = true,
                display_in_hud = true,
                is_perk = false
            })
            GamePrintImportant(GameTextGet("$noitatogether_hourglass_boost_title", player_name), "$noitatogether_hourglass_speed_subtitle")
        end
    end ]]--
}
wsEvents = {
    AngerySteve = function (data)
        if (GameHasFlagRun("NT_sync_steve")) then
            AngerSteve(data.userId)
        end
    end,
    RespawnPenalty = function (data)
        if (GameHasFlagRun("NT_death_penalty_weak_respawn")) then
            RespawnPenalty(data.userId)
        end
    end,
    StartRun = function ()
        last_wands = ""
        _start_run = true
    end,
    ItemBank = function(data)
        BankItems = data.items
        BankGold = data.gold
    end,
    UserTakeFailed = function(data)
        GamePrint("$noitatogether_bank_take_item_failed")
    end,
    UserTakeSuccess = function(data)
        local item = GetItemWithId(BankItems, data.id)
        RemoveItemWithId(BankItems, data.id)
        if (data.me) then
            GamePrint("$noitatogether_bank_take_item_success")
            local queue = json.decode(NT.queuedItems)
            table.insert(queue, item)
            NT.queuedItems = json.encode(queue)
        end
    end,
    UserAddGold = function(data)
        BankGold = BankGold + data.amount
        if (PlayerList[data.userId] ~= nil) then
            GamePrint(GameTextGet("$noitatogether_bank_player_deposited_gold", PlayerList[data.userId].name, tostring(data.amount)))
        end
    end,
    UserTakeGoldSuccess = function(data)
        BankGold = BankGold - data.amount
        if (data.me) then
            GamePrint("$noitatogether_bank_take_gold_success")
            NT.gold_queue = NT.gold_queue + data.amount
        end
    end,
    UserTakeGoldFailed = function(data)
        GamePrint("$noitatogether_bank_take_gold_failed")
    end,
    RequestGameInfo = function(data)
        local seed = StatsGetValue("world_seed")
        local mods = ModGetActiveModIDs()
        SendWsEvent({event="GameInfo", payload={seed=seed, mods=mods, version="v0.10.86", beta=GameIsBetaBuild()}})
        SendWsEvent({event="RequestPlayerList", payload={}})
        PopulateSpellList()
    end,
    PlayerMove = function(data)
        local last = data.frames[math.floor(#data.frames/2)]
        PlayerList[data.userId].x = last.x
        PlayerList[data.userId].y = last.y
        PlayerList[data.userId].scale_x = last.scaleX
        MovePlayerGhost(data)
    end,
    PlayerPos = function(data)
        PlayerList[data.userId].x = data.x
        PlayerList[data.userId].y = data.y
        PlayerList[data.userId].scale_x = 1
        TeleportPlayerGhost(data)
    end,
    PlayerUpdate = function(data)
        if (PlayerList[data.userId] ~= nil) then
            for key, value in pairs(data) do
                PlayerList[data.userId][key] = value
            end
        end
    end,
    PlayerUpdateInventory = function(data)
        --NT.players[data.userId].inventory = data.inventory
    end,
    UserAddItems = function(data)
        for index, item in ipairs(data.items) do
            table.insert(BankItems, item)
        end
        if (PlayerList[data.userId] ~= nil) then
            GamePrint(GameTextGet("$noitatogether_bank_player_deposited_items", PlayerList[data.userId].name, tostring(#data.items)))
        end
    end,
    AddPlayer = function(data)
        if (PlayerList[data.userId] ~= nil) then return end
        PlayerList[data.userId] = {
            x = 0,
            y = 0,
            curHp = 100,
            maxHp = 100,
            name = data.name,
            userId = data.userId,
            location = "Mountain",
            sampo = false,
            inven = {}
        }
        PlayerCount = PlayerCount + 1
        if (not HideGhosts) then
            SpawnPlayerGhost(data, data.userId)
        end

        --worry about perf later
        _Players = {}
        for k, v in pairs(PlayerList) do
            table.insert(_Players,{k,string.upper(v.name)})
        end
        
        table.sort(_Players, function(a,b) return a[2] < b[2] end)
    end,
    RemovePlayer = function(data)
        DespawnPlayerGhost(data.userId)
        PlayerList[data.userId] = nil
        PlayerCount = PlayerCount - 1
    end,
    PlayerPickup = function(data)
        if (data.heart ~= nil) then
            PlayerHeartPickup(data.heart.hpPerk, data.userId)
        elseif (data.orb ~= nil) then
            PlayerOrbPickup(data.orb.id, data.userId)
        end
    end,
    PlayerDeath = function(data)
        if (data.isWin == true) then
            PlayerList[data.userId].curHp = 0
            --InGameChatAddMsg({name = "[System]", message = msg})
            GamePrintImportant(GameTextGet("$noitatogether_player_won", PlayerList[data.userId].name), "")
        else
            PlayerList[data.userId].curHp = 0
            --msg = PlayerList[data.userId].name .. " has died." --changed the text of this, so just commenting out for now..
            if (GameHasFlagRun("NT_death_penalty_end") or GameHasFlagRun("NT_death_penalty_weak_respawn")) then
                NT.end_msg = GameTextGet("$noitatogether_player_died", PlayerList[data.userId].name)
                FinishRun()
            end
        end
    end,
    PlayerSecretHourglass = function(data)
    end,
    Chat = function(data)
        if (not HideChat) then
            GamePrint(data.name .. ": " .. data.message)
        end
    end,
    PlayerList = function(data)
        --[{name, userId}] ?
        for _, value in ipairs(data) do
            PlayerList[value.userId] = {
                name = value.name,
                curHp = 100,
                maxHp = 100,
                x = 0,
                y = 0,
                speed = 1,
                location = "Mountain",
                inven = {}
            }
        end
    end,
    UpdateFlags = function(data)
        dofile("mods/noita-together/files/scripts/remove_flags.lua")
        for _, entry in ipairs(data) do
            if (entry.flag == "NT_sync_world_seed") then
                ModSettingSet( "noita_together.seed", entry.uIntVal )
                local seed = tonumber(StatsGetValue("world_seed"))
                if (entry.uIntVal > 0 and seed ~= entry.uIntVal) then
                    GameTriggerGameOver()
                --elseif (entry.intVal == seed) then messes up random perks/items sadge
                    --ModSettingSet( "noita_together.seed", 0 )
                end
            else
                GameAddFlagRun(entry.flag)
            end
        end
    end
}
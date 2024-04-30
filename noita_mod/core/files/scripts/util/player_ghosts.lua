--move player ghost utility code into this file!
function SpawnPlayerGhosts(player_list)
    for userId, player in pairs(player_list) do
        local ghost = SpawnPlayerGhost(player, userId)
        
        --this only happens if SpawnPlayerGhost for some reason returns nil
        --most likely reason for this is because noita emotes overwrote the function
        --see the interoperability notice on SpawnPlayerGhost
        if ghost == nil then
            --this is in a weird spot on purpose, see interop notice on SpawnPlayerGhost
            --invalidate stored ghost entity (it will be recached)
            player.ghostEntityId = nil 
            --apply cosmetics, finding ghost in process
            SetPlayerGhostCosmetics(userId, nil)
            --refresh inventory
            SetPlayerGhostInventory(userId, nil)
        end
    end
end

--interoperability notice: noita emotes overwrites this function, so let infinitesunrise know if we change it
--might(?) still work when moved into this file and dofile() included from original utils.lua???
function SpawnPlayerGhost(player, userId)
    local ghost = EntityLoad("mods/noita-together/files/entities/ntplayer.xml", 0, 0)
    AppendName(ghost, player.name)
    local vars = EntityGetComponent(ghost, "VariableStorageComponent")
    for _, var in pairs(vars) do
        local name = ComponentGetValue2(var, "name")
        if (name == "userId") then
            ComponentSetValue2(var, "value_string", userId)
        end
        if (name == "inven") then
            ComponentSetValue2(var, "value_string", json.encode(PlayerList[userId].inven))
        end
    end
    if (player.x ~= nil and player.y ~= nil) then
        EntitySetTransform(ghost, player.x, player.y)
    end

    --cache the ghost's entity id for this player
    player.ghostEntityId = ghost
    --apply cosmetics (if known)
    SetPlayerGhostCosmetics(userId, ghost)
    --refresh inventory
    SetPlayerGhostInventory(userId, ghost)
    --toggle ghost based on settings
    if ModSettingGet("noita-together.NT_FOLLOW_DEFAULT") then
        EntityAddTag(ghost, "nt_follow")
    end
    --return reference to created ghost
    return ghost
end

function DespawnPlayerGhosts()
    local ghosts = EntityGetWithTag("nt_ghost")
    for _, eid in pairs(ghosts) do
        EntityKill(eid)
    end

    --clear cached ghosts from all players
    for userId, entry in pairs(PlayerList) do
        --nt print_error("DespawnPlayerGhosts: invalidating cached ghost for userId " .. userId)
        entry.ghostEntityId = nil
    end
end

function DespawnPlayerGhost(userId)
    local ghosts = EntityGetWithTag("nt_ghost")
    for _, ghost in pairs(ghosts) do
        local vars = EntityGetComponent(ghost, "VariableStorageComponent")
        for _, var in pairs(vars) do
            local name = ComponentGetValue2(var, "name")
            if (name == "userId") then
                local id = ComponentGetValue2(var, "value_string")
                if (id == userId) then EntityKill(ghost) end
            end
        end
    end
end

function TeleportPlayerGhost(data)
    local ghosts = EntityGetWithTag("nt_ghost")

    for _, ghost in pairs(ghosts) do
        local id_comp = get_variable_storage_component(ghost, "userId")
        local userId = ComponentGetValue2(id_comp, "value_string")
        if (userId == data.userId) then
            EntitySetTransform(ghost, data.x, data.y)
            break
        end
    end
end

function MovePlayerGhost(data)
    local ghosts = EntityGetWithTag("nt_ghost")

    for _, ghost in pairs(ghosts) do
        local id_comp = get_variable_storage_component(ghost, "userId")
        local userId = ComponentGetValue2(id_comp, "value_string")
        if (userId == data.userId) then
            local dest = get_variable_storage_component(ghost, "dest")
            
            ComponentSetValue2(dest, "value_string", data.jank)
            break
        end
    end
end

--utility function to get the ghost entity for a particular player, tries cached value then checks all ghosts
function GetPlayerGhost(userId)
    --store/fetch player ghost's entity from its PlayerList object
    local eid = PlayerList[userId].ghostEntityId or 0
    if eid ~= 0 and EntityHasTag(eid, "nt_ghost") then
        local id_comp = get_variable_storage_component(eid, "userId")
        local entityUserId = ComponentGetValue2(id_comp, "value_string")

        if entityUserId == userId then
            --nt print_error("GetPlayerGhost: use cached ghost " .. eid .. " for userId " .. userId)
            return eid
        end
    end

    --ghostEntityId was not the ghost, need to check all ghosts
    local ghosts = EntityGetWithTag("nt_ghost")

    for _, ghost in pairs(ghosts) do
        local id_comp = get_variable_storage_component(ghost, "userId")
        local entityUserId = ComponentGetValue2(id_comp, "value_string")

        if entityUserId == userId then
            --cache this value for later calls
            PlayerList[userId].ghostEntityId = ghost
            --nt print_error("GetPlayerGhost: caching ghost " .. ghost .. " for userId " .. userId)
            return ghost
        end
    end

    --failed to find
    --nt print_error("GetPlayerGhost failed to find for userId " .. userId)
    return nil
end

--set inventory on a player's ghost
--userId is the player userid, non-nil
--ghost is the ghost entity, if nil try to find it
function SetPlayerGhostInventory(userId, ghost)
    --nt print_error("SetPlayerGhostInventory: ghost " .. (ghost or "(nil)") .. ", userId " .. userId)

    --get player ghost entity
    if not ghost then
        ghost = GetPlayerGhost(userId)

        if not ghost then
            --nt print_error("SetPlayerGhostInventory: failed to find player's ghost???")
            --should we print a real error?
            return
        end
    end

    local inven = ","
    for i, wand in ipairs(PlayerList[userId].inven) do
        inven = inven .. "," .. tostring(wand.stats.inven_slot) .. "," .. wand.stats.sprite .. ","
    end

    local inventoryVSComp = get_variable_storage_component(ghost, "inven")
    ComponentSetValue2(inventoryVSComp, "value_string", inven)
end

--PLAYER GHOST COSMETICS
function GetPlayerCosmeticFlags()
    local data = {}
    if HasFlagPersistent( "secret_amulet" ) then
        table.insert(data, "player_amulet")
    end
    if HasFlagPersistent( "secret_amulet_gem" ) then
        table.insert(data, "player_amulet_gem")
    end
    if HasFlagPersistent( "secret_hat" ) then
        table.insert(data, "player_hat2")
    end
    return data
end

function StorePlayerGhostCosmetic(data, refresh)
    if PlayerList[data.userId] ~= nil then
        local cosmeticFlags = {}

        --nt print_error("StorePlayerGhostCosmetic: store " .. ((data and #(data.flags)) or "(nil?)") .. " cosmetic flags for userId " .. data.userId)
        if data.flags and #(data.flags) > 0 then
            for _, flag in pairs(data.flags) do
                cosmeticFlags[#cosmeticFlags+1] = flag
                --nt print_error(" + " .. flag)
            end
        end

        PlayerList[data.userId].cosmeticFlags = cosmeticFlags

        if refresh then
            SetPlayerGhostCosmetics(data.userId)
        end
    else
        --nt print_error("StorePlayerGhostCosmetic: invalid userId " .. data.userId)
    end
end

--set cosmetics on a player's ghost
--userId is the player userid, non-nil
--ghost is the ghost entity, if nil try to find it
function SetPlayerGhostCosmetics(userId, ghost)
    --nt print_error("SetPlayerGhostCosmetics: ghost " .. (ghost or "(nil)") .. ", userId " .. userId)

    --get player ghost entity
    if not ghost then
        ghost = GetPlayerGhost(userId)

        if not ghost then
            --nt print_error("SetPlayerGhostCosmetics: failed to find player's ghost???")
            --should we print a real error?
            return
        end
    end

    --TODO do we need to be able to CLEAR these flags ever?
    for _, flag in pairs(PlayerList[userId].cosmeticFlags) do
        EntitySetComponentsWithTagEnabled(ghost, flag, true)
    end
end

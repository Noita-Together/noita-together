--[[
  Implementation derived from
  data/scripts/magic/null_room/check.lua - nullroom_remove_all_perks()
  data/scripts/perks/perk.lua - IMPL_remove_all_perks() and create_all_player_perks()
]]
dofile("data/scripts/game_helpers.lua")
dofile_once("mods/noita-together/files/scripts/ban_perks.lua")
dofile_once("data/scripts/lib/utilities.lua")
dofile_once("data/scripts/perks/perk_list.lua")

local function ForceGetPlayerId()
    local players = get_players()
    local player_id = players[1]

    if (player_id ~= nil) then
        return player_id
    else
        players = EntityGetWithTag("polymorphed_player")
        player_id = players[1]
        if (player_id ~= nil) then
            --[[
              This is where it could be identified that an event from the app will need retried
              due to the player being polymorphed when noita received the event. For instance sending
              an event back to the app to resend a given event to this player after a delay.
            ]]
        else
            players = EntityGetWithTag("polymorphed_cessation")
            player_id = players[1]
            if (player_id ~= nil) then
                -- The same as above applies here
            end
        end
    end
end

local function BannedPerksDataTable()
    local banned_perk_data = {}
    for _, perk_id in ipairs(BannedPerksTable()) do
        table.insert(banned_perk_data, get_perk_with_id(perk_list, perk_id))
    end
    return banned_perk_data
end

local function SpawnBannedPerks(player_id)
    -- Not sure how a player might still be nil but play it safe
    if (player_id ~= nil) then
        local perks_to_spawn = {}
        for _, perk_data in ipairs(BannedPerksDataTable()) do
            local perk_id = perk_data.id
            if (perk_data.one_off_effect == nil) or (perk_data.one_off_effect == false) then
                local flag_name = get_perk_picked_flag_name(perk_id)
                local pickup_count = tonumber(GlobalsGetValue(flag_name .. "_PICKUP_COUNT", "0"))

                if GameHasFlagRun(flag_name) or (pickup_count > 0) then
                    table.insert(perks_to_spawn, { perk_id, pickup_count })
                end
            end
        end
        local x, y = EntityGetTransform(player_id)
        -- Cosmetic adjustment so that perks do not clip into the floor
        y = y - 8
        --[[
          Math section below can be summarized:
          Spawn all player perks on arcs from the player position
          Increase the distance from the player for each new arc
          Place perks on the arcs with equidistant arc segments between them
          Limit the amount of perks per arc and allow increased perks the farther an arc is from the player
        ]]
        -- Polar (r, theta) is essentially a matrix of (row, column)
        local full_arc = math.pi
        local col_limit = 8
        local col_size_inc = 4
        local column = 0
        local total_count = 0
        local max_count = 0

        local angle = (full_arc) / (col_limit + 1)
        local inc = angle

        local length = 24
        local len_inc = 16

        for i, v in ipairs(perks_to_spawn) do
            max_count = max_count + v[2]
        end

        for i, v in ipairs(perks_to_spawn) do
            local pid = v[1]
            local pcount = v[2]

            if (pcount > 0) then
                for j = 1, pcount do
                    -- Smooth out the final arc segment angles
                    if (column == 0 and total_count + col_limit > max_count) then
                        angle = (full_arc) / (max_count - total_count + 1)
                        inc = angle
                    else
                        total_count = total_count + 1
                    end

                    local px = x + math.cos(angle) * length
                    local py = y - math.sin(angle) * length
                    -- Maintain compatibility with NT_sync_perks and NT_team_perks by adding NT_DONT_SHARE
                    local perk_entity = perk_spawn_with_name(px, py, pid, true)
                    EntityAddComponent(perk_entity, "VariableStorageComponent",
                        {
                            name = "NT_DONT_SHARE",
                            value_string = "",
                        })

                    angle = angle + inc
                    column = column + 1

                    if (column >= col_limit) then
                        column = 0
                        col_limit = col_limit + col_size_inc
                        length = length + len_inc

                        angle = (full_arc) / (col_limit + 1)
                        inc = angle
                    end
                end
            end
        end
    end
end

local function RemoveBannedPerks(player_id)
    local perk_was_removed = false
    -- Not sure how a player might still be nil but play it safe
    if (player_id ~= nil) then
        for i, perk_data in ipairs(BannedPerksDataTable()) do
            local perk_id = perk_data.id

            local flag_name = get_perk_picked_flag_name(perk_id)
            local pickup_count = tonumber(GlobalsGetValue(flag_name .. "_PICKUP_COUNT", "0"))

            if (GameHasFlagRun(flag_name) or (pickup_count > 0)) and ((perk_data.do_not_remove == nil) or (perk_data.do_not_remove == false)) then
                perk_was_removed = true
                print("Removing " .. perk_id)
                GameRemoveFlagRun(flag_name)
                pickup_count = 0
                GlobalsSetValue(flag_name .. "_PICKUP_COUNT", tostring(pickup_count))

                if (perk_data.game_effect ~= nil) then
                    local effect_count = GameGetGameEffectCount(player_id, perk_data.game_effect)
                    for m = 1, effect_count do
                        local effect_comp = GameGetGameEffect(player_id, perk_data.game_effect)
                        if (effect_comp ~= NULL_ENTITY) then
                            -- Check for the perk_component so that only perk effects are removed
                            -- Prevents removal of perk effects from non-perk sources, such as hourglass buff
                            if ComponentHasTag(effect_comp, "perk_component") then
                                EntityRemoveComponent(player_id, effect_comp)
                            end
                        end
                    end
                end

                if (perk_data.game_effect2 ~= nil) then
                    local effect_count = GameGetGameEffectCount(player_id, perk_data.game_effect2)
                    for m = 1, effect_count do
                        local effect_comp = GameGetGameEffect(player_id, perk_data.game_effect2)
                        if (effect_comp ~= NULL_ENTITY) then
                            -- Check for the perk_component so that only perk effects are removed
                            -- Prevents removal of perk effects from non-perk sources, such as hourglass buff
                            if ComponentHasTag(effect_comp, "perk_component") then
                                EntityRemoveComponent(player_id, effect_comp)
                            end
                        end
                    end
                end

                if (perk_data.func_remove ~= nil) then
                    perk_data.func_remove(player_id)
                end

                --[[
                  If adding Lukki mutation/Leggy perks to banned perks it needs reversed
                  Reference in data/scripts/perks/perk.lua IMPL_remove_all_perks()
                ]]
                -- Remove ui icon only for removed perks
                local c = EntityGetAllChildren(player_id)
                if (c ~= nil) then
                    for a, child in ipairs(c) do
                        if EntityHasTag(child, "perk_entity") then
                            local uiicon_comps = EntityGetComponent(child, "UIIconComponent")
                            if (uiicon_comps ~= nil) then
                                for i, comp in ipairs(uiicon_comps) do
                                    local name = ComponentGetValue2(comp, "name")
                                    if (name == perk_data.ui_name) then
                                        EntityKill(child)
                                        break
                                    end
                                end
                            end
                        end
                    end
                end


                if (perk_data.remove_other_perks ~= nil) then
                    for a, b in ipairs(perk_data.remove_other_perks) do
                        local f = get_perk_picked_flag_name(b)
                        GameRemoveFlagRun(f)
                    end
                end
            end
        end
        --[[
          If adding perks to banned perks that contain a perk_component as part of their perk_data.func it will need removed
          Reference in data/scripts/perks/perk.lua IMPL_remove_all_perks()
        ]]

        --[[
          If adding perks to banned perks that impact halo, rattiness, funginess, ghostness, or lukkiness their levels need decremented
          Reference to incrementing their levels can be found in:
          data/scripts/perks/perk_utilities.lua
            add_halo_level()
            add_rattiness_level()
            add_funginess_level()
            add_ghostness_level()
            add_lukkiness_level()
        ]]

        --[[
          If adding perks to banned perks that produce entities, like ghosts, they need killed
          Reference in data/scripts/perks/perk.lua IMPL_remove_all_perks()
        ]]
    end
    return perk_was_removed
end

function HandleBannedPerksEvent()
    local player_id = ForceGetPlayerId()
    SpawnBannedPerks(player_id)
    local perks_removed = RemoveBannedPerks(player_id)
    if (perks_removed) then
        local x, y = EntityGetTransform(player_id)
        EntityLoad("data/entities/particles/supernova.xml", x, y)
        GamePrintImportant("$noitatogether_banned_perk_removed_title", "$noitatogether_banned_perk_removed_subtitle")
    end
end

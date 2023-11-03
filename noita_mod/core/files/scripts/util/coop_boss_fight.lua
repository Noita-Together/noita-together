--include in utils.lua by dofile_once :)

local NT_SAMPO_UNLOCK_DIST = 200

function CoopBossFightStart(data)
    --print_error("CoopBossFightStart")
    if not GameHasFlagRun("NT_final_boss_active") then
        GameAddFlagRun("NT_final_boss_active")
        --nt print_error("start the boss fight")
        local x, y = GetPlayerPos()
        GameTriggerMusicFadeOutAndDequeueAll( 10.0 )
        GamePlaySound( "data/audio/Desktop/event_cues.bank", "event_cues/sampo_pick/create", x, y )
        GameTriggerMusicEvent( "music/boss_arena/battle", false, x, y )
        SetRandomSeed( x, y )
        GlobalsSetValue( "FINAL_BOSS_ACTIVE", "1" )
        
        local entities = EntityGetWithTag( "sampo_or_boss" )
        if ( #entities == 0 ) then
            return
        end
        
        for key,entity_id in pairs(entities) do
            if EntityHasTag( entity_id, "boss_centipede" ) then
                EntitySetComponentsWithTagEnabled( entity_id, "disabled_at_start", true )
                EntitySetComponentsWithTagEnabled( entity_id, "enabled_at_start", false )
                PhysicsSetStatic( entity_id, false )
                EntityAddTag( entity_id, "boss_centipede_active" )
                
                local child_entities = EntityGetAllChildren( entity_id )
                local child_to_remove = 0
                
                if ( child_entities ~= nil ) then
                    for i,child_id in ipairs( child_entities ) do
                        EntityHasTag( child_id, "protection" )
                        child_to_remove = child_id
                    end
                end
                
                if ( child_to_remove ~= 0 ) then
                    EntityKill( child_to_remove )
                end
            end
        end
    end
end

function CoopSampoUnlock(data)
    --print_error("CoopSampoUnlock")
    if not GameHasFlagRun("NT_unlocked_sampo") then
        --trigger new sampo aura transition
        local sampo_aura = EntityGetWithTag("nt_sampo_aura")[1]
        if sampo_aura then
            local lua_component = EntityGetFirstComponentIncludingDisabled(sampo_aura, "LuaComponent")
            EntitySetComponentIsEnabled(sampo_aura, lua_component, true)
        end

        --TODO the old code generated a platform if it was missing for some reason, do we still want to do that?

        --
        GameAddFlagRun("NT_unlocked_sampo")
    elseif GameHasFlagRun("NT_got_sampo") then --cant pick up sampo before it unlocks anyway
        --send sampo pickup state in response
        SendWsEvent({event="CustomModEvent", payload={name="CoopSampoPickup",orbs=NT.sampo_orbs}})
    end
end

--call when another player sends sampo picked up reply
function CoopSampoPickup(data)
    print_error("CoopSampoPickup")
    local player = PlayerList[data.userId]
    if not player then return end
    
    if not player.sampo then
        print_error("player " .. player.name .. " got mcguffin with " .. (data.orbs or 0) .. " orbz")
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

        --use a different message key if we already got our sampo
        local sampo_basemsgkey = GameHasFlagRun("NT_got_sampo") and "$noitatogether_player_got_mcguffin" or "$noitatogether_player_got_mcguffin_waiting"
        
        local sampo_message = nil
        if orbs >= 13 then --show exact orb count, no longer uniquely named
            sampo_message = GameTextGet(sampo_basemsgkey .. "_orbs", player.name, GameTextGet("$item_mcguffin_" .. tostring(orbs_for_name)), tostring(orbs))
        else
            sampo_message = GameTextGet(sampo_basemsgkey, player.name, GameTextGet("$item_mcguffin_" .. tostring(orbs_for_name)))
        end
        GamePrint(sampo_message)

        player.sampo = true

        if GameHasFlagRun("NT_is_host") and CoopCheckAllSampos() and not GameHasFlagRun("NT_final_boss_active") then
            CoopBossFightStart()
            SendWsEvent({event="CustomModEvent", payload={name="CoopBossFightStart"}})
            print_error("send CoopBossFightStart (in handler)")
        end
    end
end

--return true if all players have sampo picked up
function CoopCheckAllSampos()
    if not GameHasFlagRun("NT_got_sampo") then
        return false
    end

    --check who has picked up sampo
    for userId, entry in pairs(PlayerList) do
        if not entry.sampo then --set by picked-up-sampo event
            return false
        end
    end

    return true
end

function CoopBossFightTick()
    --want boss fight to start basically instantly, so check this frequently
    --we are host, sampo is unlocked, but fight has not started yet
    --this part only really runs if we are the host and pick up the sampo last :)
    if GameHasFlagRun("NT_is_host") and GameHasFlagRun("NT_unlocked_sampo") and (not GameHasFlagRun("NT_final_boss_active")) then
        if CoopCheckAllSampos() then --everyone has sampo, start the boss fight
            CoopBossFightStart()
            SendWsEvent({event="CustomModEvent", payload={name="CoopBossFightStart"}})
            print_error("send CoopBossFightStart (in tick)")
        end
    end

    --update infrequently
    if (GameGetFrameNum() % 60) == 0 then
        --re-send boss fight trigger periodically if active
        if GameHasFlagRun("NT_final_boss_active") then
            if GameHasFlagRun("NT_is_host") then
                --periodically re-send kolmi start message to make sure everyone gets it
                SendWsEvent({event="CustomModEvent", payload={name="CoopBossFightStart"}})
                print_error("send CoopBossFightStart")
            end
        else --boss fight not active yet
            if GameHasFlagRun("NT_unlocked_sampo") then
                if GameHasFlagRun("NT_is_host") then
                    --periodically send unlock message to make sure everyone gets it
                    SendWsEvent({event="CustomModEvent", payload={name="CoopSampoUnlock"}})
                    print_error("send CoopSampoUnlock")
                end

                --count number of players with sampo
                local sampo_count = (GameHasFlagRun("NT_got_sampo") and 1) or 0
                for userId, entry in pairs(PlayerList) do
                    if entry.sampo then --set by picked-up-sampo event
                        sampo_count = sampo_count + 1
                    end
                end

                --TODO do something with this, like display it somewhere
                print_error("" .. sampo_count .. " players have the sampo")
            else
                --get the disabled sampo
                local entities = EntityGetWithTag("disabled_sampo")
                --sampo doesnt exist or not spawned yet? nothing to do then
                if #entities < 1 or not entities[1] then return end
    
                local sampo_near, sampo_far = GetPlayersNearSampo(entities[1], NT_SAMPO_UNLOCK_DIST)
                
                --can't calculate yet (not loaded in?)
                if sampo_near < 0 or sampo_far < 0 then return end
    
                print_error("sampo " .. sampo_near .. " " .. sampo_far .. " " .. (1 + #PlayerList))
    
                if sampo_far == 0 and sampo_near > 0 then
                    --host determines when sampo should unlock
                    if GameHasFlagRun("NT_is_host") then
                        CoopSampoUnlock()
                        SendWsEvent({event="CustomModEvent", payload={name="CoopSampoUnlock"}})
                        print_error("send CoopSampoUnlock")
                    end
                else 
                    --TODO update display
                    print_error("dont unlock sampo yet, only " .. sampo_near .. " players nearby")
                end
            end
        end
        
    end
end

function GetPlayersNearSampo(disabled_sampo, distance)
    local sx,sy = EntityGetTransform(disabled_sampo)
    local players_near_sampo = 0
    local players_not_near_sampo = 0

    --check ourselves first :)
    local px, py = EntityGetTransform(GetPlayer())
    dist_squared = (sx - px)^2 + (sy - py)^2

    if dist_squared < (distance)^2 then
        players_near_sampo = players_near_sampo + 1
    else
        players_not_near_sampo = players_not_near_sampo + 1
    end

    --check other players now
    for userId, entry in pairs(PlayerList) do
        dist_squared = (sx - entry.x)^2 + (sy - entry.y)^2

        if dist_squared < (distance)^2 then
            players_near_sampo = players_near_sampo + 1
        else
            players_not_near_sampo = players_not_near_sampo + 1
        end
    end

    return players_near_sampo,players_not_near_sampo
end
--include in utils.lua by dofile_once :)

local NT_SAMPO_UNLOCK_DIST = 200

function CoopBossFightStart(data)
    --print_error("CoopBossFightStart")
    if not GameHasFlagRun("NT_final_boss_active") then
        GameAddFlagRun("NT_final_boss_active")
        print_error("TODO start the boss fight :)")
        GamePrintImportant("TODO Boss Fight", "Oops this doesnt work yet :)")
    end
end

function CoopSampoUnlock(data)
    --print_error("CoopSampoUnlock")
    if not GameHasFlagRun("NT_unlocked_sampo") then
        --(old code: replace the disabled sampo with the real sampo)
        --[[local disabled_sampo = EntityGetWithTag("disabled_sampo")[1]
        if (disabled_sampo == nil) then
            return false
        end
        local x, y = EntityGetTransform(disabled_sampo)
        EntityKill(disabled_sampo)
        local has_platform = RaytracePlatforms(x,y, x, y + 50)
        --print("has platform " .. tostring(has_platform))
        if (not has_platform) then
            EntityLoad( "mods/noita-together/files/entities/sampo/platform.xml", x, y + 50)
        end
        EntityLoad( "data/entities/animals/boss_centipede/sampo.xml", x, y )]]--
        
        --trigger new sampo aura transition
        local sampo_aura = EntityGetWithTag("nt_sampo_aura")[1]
        if sampo_aura then
            local lua_component = EntityGetFirstComponentIncludingDisabled(sampo_aura, "LuaComponent")
            EntitySetComponentIsEnabled(sampo_aura, lua_component, true)
        end

        --TODO the old code generated a platform if it was missing for some reason, do we still want to do that?

        --
        GameAddFlagRun("NT_unlocked_sampo")
    end
end

function CoopBossFightTick()
    --update infrequently
    if (GameGetFrameNum() % 60) == 0 then
        --release me
        if GameHasFlagRun("NT_final_boss_active") then
            if GameHasFlagRun("NT_is_host") then
                --periodically send kolmi start message to make sure everyone gets it
                SendWsEvent({event="CustomModEvent", payload={name="CoopBossFightStart"}})
                print_error("send CoopBossFightStart")
            end
        else            
            if GameHasFlagRun("NT_unlocked_sampo") then
                --check who has picked up sampo
                local sampos = true
                for userId, entry in pairs(PlayerList) do
                    if not entry.sampo then --set by picked-up-sampo event
                        sampos = false
                    end
                end

                if sampos then --everyone has sampo, start sending the boss fight start
                    if GameHasFlagRun("NT_is_host") then
                        CoopBossFightStart()
                        SendWsEvent({event="CustomModEvent", payload={name="CoopBossFightStart"}})
                        print_error("send CoopBossFightStart")
                    end
                else --not everyone has sampo yet
                    if GameHasFlagRun("NT_is_host") then
                        --periodically send unlock message to make sure everyone gets it
                        SendWsEvent({event="CustomModEvent", payload={name="CoopSampoUnlock"}})
                        print_error("send CoopSampoUnlock")
                    end
                end
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
                    --update notice on hidden sampo
                    print_error("dont unlock sampo yet")
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
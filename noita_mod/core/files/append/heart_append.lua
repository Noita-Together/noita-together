dofile_once("mods/noita-together/files/store.lua")
dofile_once("mods/noita-together/files/scripts/json.lua")
_item_pickup = _item_pickup or item_pickup

function shared_heart(entity_item, entity_who_picked, name)
    local damagemodels = EntityGetComponent(entity_who_picked, "DamageModelComponent")
    local variablestorages = EntityGetComponent(entity_who_picked, "VariableStorageComponent")

    local max_hp_old = 0
    local max_hp = 0
    local multiplier = tonumber( GlobalsGetValue( "HEARTS_MORE_EXTRA_HP_MULTIPLIER", "1" ) )
    local min_hp_to_add = 0.16 * multiplier

    local x, y = EntityGetTransform(entity_item)
    local playercount = NT.player_count
    if (damagemodels ~= nil) then
        for i, damagemodel in ipairs(damagemodels) do
            max_hp = tonumber(ComponentGetValue(damagemodel, "max_hp"))
            max_hp_old = max_hp
            if (GameHasFlagRun("NT_sync_hearts")) then
                local expected_max_hp = min_hp_to_add
                if(playercount > 0) then
                    expected_max_hp = (1 / (playercount)) * multiplier
                end
                max_hp = max_hp + math.max(min_hp_to_add , expected_max_hp)
            else
                max_hp = max_hp + 1 * multiplier
            end
            local max_hp_cap = tonumber(ComponentGetValue(damagemodel, "max_hp_cap"))
            if max_hp_cap > 0 then
                max_hp = math.min(max_hp, max_hp_cap)
            end

            -- if( hp > max_hp ) then hp = max_hp end
            ComponentSetValue(damagemodel, "max_hp", max_hp)
        end
    end

    EntityLoad("data/entities/particles/image_emitters/heart_effect.xml", x, y - 12)
    EntityLoad("data/entities/particles/heart_out.xml", x, y - 8)
    local description = GameTextGet("$logdesc_heart", tostring(math.floor(max_hp * 25)))
    if max_hp == max_hp_old then
        description = GameTextGet("$logdesc_heart_blocked", tostring(math.floor(max_hp * 25)))
    end

    GamePrintImportant("$log_heart", description)
    if playercount == 0 then
        description = GameTextGet("$noitatogether_heart_blocked_playercount")
        print_error(description)
        GamePrint(description)
    end
    GameTriggerMusicCue("item")
    EntityKill(entity_item)
end

function item_pickup(entity_item, entity_who_picked, name)
    if (GameHasFlagRun("NT_GAMEMODE_CO_OP") and GameHasFlagRun("NT_sync_hearts")) then
        shared_heart(entity_item, entity_who_picked, name)
        if not EntityHasTag(entity_item,"fake_orb") then --reuse fake_orb tag because there is a tag limit :) 
            local queue = json.decode(NT.wsQueue)
            table.insert(queue, {event="PlayerPickup", payload={heart={hpPerk=false}}})
            NT.wsQueue = json.encode(queue)
        end
    else
        _item_pickup(entity_item, entity_who_picked, name)
    end
end

--register hourglass events
function RegisterHourglassEvent(effect, handler, force)
    --refuse to overwrite existing handler unless force true
    if hourglassEventHandlers[effect] ~= nil and not force then
        --todo emit a warning
        return false
    end

    --make sure handler is a function or nil 
    --handler can be nil along with force=true to unregister a handler for some reason
    if handler ~= nil and type(handler) ~= "function" then
        --todo emit a warning
        return false
    end

    --assign it
    hourglassEventHandlers[effect] = handler

    --return true, success
    return true
end

--handle an hourglass event
function HandleHourglassEvent(data)
    local handler = hourglassEventHandlers[data.effect];
    --ignore if there is not a function for data.effect
    if ( handler == nil or type(handler) ~= "function" ) then
        --Emit a warning and do nothing???
        --todo something more graceful
        GamePrint("(NT) Warning: Unrecognized hourglass event \"" .. data.effect .. "\" !")
    else
        --run the registered handler for this effect class
        handler(GetPlayer(), PlayerList[data.userId].name, data)
    end
end

--static initializer kinda thing
if not hourglassEventHandlers then
    hourglassEventHandlers = {}

    --DEFAULT NT HOURGLASS EVENTS
    assert(RegisterHourglassEvent("ambrosia", function(player, triggered_by_name, data)
        local x, y = GetPlayerOrCameraPos()
        local effect_entity = EntityLoad("mods/noita-together/files/effects/weak_ambrosia.xml", x, y)
        EntityAddChild(player, effect_entity)
        EntityAddComponent2(effect_entity, "UIIconComponent", {
            icon_sprite_file = "data/ui_gfx/status_indicators/protection_all.png",
            name = GameTextGet("$noitatogether_hourglass_buff_protection_name"),
            description = GameTextGet("$noitatogether_hourglass_buff_protection_desc", triggered_by_name),
            display_above_head = true,
            display_in_hud = true,
            is_perk = false
        })
        GamePrintImportant(GameTextGet("$noitatogether_hourglass_boost_title", triggered_by_name), "$noitatogether_hourglass_ambrosia_subtitle")
    end))

    assert(RegisterHourglassEvent("berserk", function(player, triggered_by_name, data)
        local effect_entity = LoadGameEffectEntityTo(player, "data/entities/misc/effect_damage_multiplier.xml")
        local effect_comp = EntityGetFirstComponent(effect_entity, "GameEffectComponent")
        ComponentSetValue2(effect_comp, "frames", 60*120)
        EntityAddComponent2(effect_entity, "UIIconComponent", {
            icon_sprite_file = "data/ui_gfx/status_indicators/berserk.png",
            name = GameTextGet("$noitatogether_hourglass_buff_damage_name"),
            description = GameTextGet("$noitatogether_hourglass_buff_damage_desc", triggered_by_name),
            display_above_head = true,
            display_in_hud = true,
            is_perk = false
        })
        GamePrintImportant(GameTextGet("$noitatogether_hourglass_boost_title", triggered_by_name), "$noitatogether_hourglass_berserk_subtitle")
    end))

    assert(RegisterHourglassEvent("charm", function(player, triggered_by_name, data)
        local x, y = GetPlayerOrCameraPos()
        EntityLoad("data/entities/projectiles/deck/regeneration_field_long.xml", x, y)
        GamePrintImportant(GameTextGet("$noitatogether_hourglass_boon_title", triggered_by_name), "")
    end))

    assert(RegisterHourglassEvent("confusion", function(player, triggered_by_name, data)
        local fungi = CellFactory_GetType("fungi")
        if (player ~= nil) then
            EntityIngestMaterial( player, fungi, 300 )
            local stomach = EntityGetFirstComponent(player, "IngestionComponent")
            if (stomach ~= nil) then
                local ingestion_size = ComponentGetValue2(stomach, "ingestion_size")
                ComponentSetValue2(stomach, "ingestion_size", math.max(0, ingestion_size - 300))
            end
            GamePrintImportant(GameTextGet("$noitatogether_hourglass_fungus_title", triggered_by_name), "$noitatogether_hourglass_fungus_subtitle_yes")
        else
            GamePrintImportant(GameTextGet("$noitatogether_hourglass_fungus_title", triggered_by_name), "$noitatogether_hourglass_fungus_subtitle_no")
        end
    end))

    assert(RegisterHourglassEvent("speed", function(player, triggered_by_name, data)
        local effect_entity = LoadGameEffectEntityTo(player, "data/entities/misc/effect_movement_faster.xml")
        local effect_comp = EntityGetFirstComponent(effect_entity, "GameEffectComponent")
        ComponentSetValue2(effect_comp, "frames", 60*45)
        EntityAddComponent2(effect_entity, "UIIconComponent", {
            icon_sprite_file = "data/ui_gfx/status_indicators/movement_faster.png",
            name = GameTextGet("$noitatogether_hourglass_buff_speed_name"),
            description = GameTextGet("$noitatogether_hourglass_buff_speed_desc", triggered_by_name),
            display_above_head = true,
            display_in_hud = true,
            is_perk = false
        })
        GamePrintImportant(GameTextGet("$noitatogether_hourglass_boost_title", triggered_by_name), "$noitatogether_hourglass_speed_subtitle")
    end))

    --NEW NT HOURGLASS EFFECTS AUGUST 2023
    --add an extra max hp perk from healthium
    --[[assert(RegisterHourglassEvent("healthium"), function(player, triggered_by_name, data)
        --TODO
    end)]]--

    --Some sort of debuff from diminution
    --[[assert(RegisterHourglassEvent("diminution"), function(player, triggered_by_name, data)
        --Debuff of some sort?
        --TODO
    end)]]--

end

--ideas:
--something to give people free max hp buff (should be rare; healthium? probably not LC tho)
--something for diminution - even if it's strictly negative?
--something for instant deathium for the memez - but probably not anything immediately dangerous?

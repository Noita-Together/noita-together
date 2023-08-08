dofile_once("mods/noita-together/files/store.lua")
dofile_once("mods/noita-together/files/scripts/json.lua")

--material area checker callback from material_area_checker_component
function material_area_checker_success( pos_x, pos_y )
	local entity_id = GetUpdatedEntityID()
	local x,y = EntityGetTransform(entity_id)
	EntitySetComponentsWithTagEnabled(entity_id, "enabled_by_liquid", true)
	EntitySetComponentsWithTagEnabled(entity_id, "disabled_by_liquid", false)
	
	-- kill others
	for _,v in pairs(EntityGetInRadiusWithTag(x, y, 150, "hourglass_entity")) do
		if v ~= entity_id then EntityKill(v) end
    end

    --get my effect name
    local variable_storage_component = EntityGetFirstComponentIncludingDisabled(entity_id, "VariableStorageComponent")
    local effect = ComponentGetValue2(variable_storage_component, "value_string")

    local queue = json.decode(NT.wsQueue)
    table.insert(queue, {event="CustomModEvent", payload={name="SecretHourglass", effect=effect}})
    NT.wsQueue = json.encode(queue)

    --TODO customizable message here
    GamePrintImportant("$noitatogether_hourglass_gave_boon", "")
end

--register hourglass events
function RegisterHourglassEvent(effect, material, handler, force)
    --refuse to overwrite existing handler unless force true
    if hourglassEventHandlers[effect] ~= nil and not force then
        --todo emit a warning?
        --print_error("(NT) Attempted to overwrite hourglass handler \"" .. effect .. "\"!") --???
        return false
    end

    --make sure handler is a function or nil 
    --handler can be nil along with force=true to unregister a handler for some reason
    if handler ~= nil and type(handler) ~= "function" then
        --todo emit a warning
        return false
    end

    --assign it
    hourglassEventHandlers[effect] = { material = material, handler = handler }

    --return true, success
    return true
end

--handle an hourglass event
function HandleHourglassEvent(data)
    local entry = hourglassEventHandlers[data.effect];
    --ignore if there is not a function for data.effect
    if entry == nil or type(entry) ~= "table" or type(entry["handler"]) ~= "function" then
        --Emit a warning and do nothing???
        --todo something more graceful
        GamePrint("(NT) Warning: Unrecognized hourglass event \"" .. data.effect .. "\" !")
    else
        --use "unknown" if the sender is unknown for some reason (bug, but causes problems if it does happen)
        local sender
        if PlayerList[data.userId] then
            sender = PlayerList[data.userId].name
        else
            sender = "unknown"
        end

        --run the registered handler for this effect class
        GamePrint("(NT) Exec hourglass event \"" .. data.effect .. "\"")
        entry["handler"](GetPlayer(), sender, data)
    end
end

--create an area checker entity for an hourglass effect
function CreateHourglassEntity(x, y, effect, material)
    GamePrint("creating hourglass entity \"" .. effect .. "\":\"" .. material .. "\"")
    if effect ~= nil and material ~= nil then
        local effect_entity = EntityLoad("mods/noita-together/files/entities/hourglass_effect_trigger.xml", x, y)
        local material_area_checker_component = EntityGetFirstComponentIncludingDisabled(effect_entity, "MaterialAreaCheckerComponent")
        mat_type = CellFactory_GetType(material)
        ComponentSetValue2(material_area_checker_component, "material", mat_type)
        ComponentSetValue2(material_area_checker_component, "material2", mat_type)
        local variable_storage_component = EntityGetFirstComponentIncludingDisabled(effect_entity, "VariableStorageComponent")
        ComponentSetValue2(variable_storage_component, "value_string", effect)
    else
        --ignore, TODO throw warning
    end
end

--static initializer kinda thing
if not hourglassEventHandlers then
    hourglassEventHandlers = {}

    --DEFAULT NT HOURGLASS EVENTS
    assert(RegisterHourglassEvent("ambrosia", "magic_liquid_protection_all", function(player, triggered_by_name, data)
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

    assert(RegisterHourglassEvent("berserk", "magic_liquid_berserk", function(player, triggered_by_name, data)
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

    assert(RegisterHourglassEvent("charm", "magic_liquid_charm", function(player, triggered_by_name, data)
        local x, y = GetPlayerOrCameraPos()
        EntityLoad("data/entities/projectiles/deck/regeneration_field_long.xml", x, y)
        GamePrintImportant(GameTextGet("$noitatogether_hourglass_boon_title", triggered_by_name), "")
    end))

    assert(RegisterHourglassEvent("confusion", "material_confusion", function(player, triggered_by_name, data)
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

    assert(RegisterHourglassEvent("speed", "magic_liquid_movement_faster", function(player, triggered_by_name, data)
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
end

local _create_all_player_perks = create_all_player_perks

-- NT_DONT_SHARE - Prevent nullification altar perks from being shared
function create_all_player_perks(x, y)
    local _perk_spawn = perk_spawn
    perk_spawn = function(x, y, perk_id, dont_remove_other_perks_)
        local perk_entity = _perk_spawn(x, y, perk_id, dont_remove_other_perks_)
        if (perk_entity ~= nil) then
            EntityAddComponent(perk_entity, "VariableStorageComponent",
                {
                    name = "NT_DONT_SHARE",
                    value_string = "",
                })
        end
        return perk_entity
    end
    _create_all_player_perks(x, y)
    perk_spawn = _perk_spawn
end

-- NT_ban_perks --
dofile_once("mods/noita-together/files/scripts/ban_perks.lua")

-- NT_ban_perks - Remove bannned perks from perk spawn order
local _perk_get_spawn_order = perk_get_spawn_order
function perk_get_spawn_order(ignore_these_)
    local ignore_these = ignore_these_ or {}
    if (GameHasFlagRun("NT_ban_perks")) then
        for _, _perk_id in ipairs(BannedPerksTable()) do
            table.insert(ignore_these, _perk_id)
        end
    end
    return _perk_get_spawn_order(ignore_these)
end

-- NT_ban_perks - Overwrite the base game perk_spawn to handle spawning different xml entities and adding LuaComponent items for switching between entities.
function perk_spawn(x, y, perk_id, dont_remove_other_perks_)
    local perk_data = get_perk_with_id(perk_list, perk_id)
    -- Leave base game print_error and print statements for logging
    if (perk_data == nil) then
        print_error("spawn_perk( perk_id ) called with'" .. perk_id .. "' - no perk with such id exists.")
        return
    end
    print("spawn_perk " .. tostring(perk_id) .. " " .. tostring(x) .. " " .. tostring(y))

    local perk_xml_path
    local perk_image_file_path
    local is_banned_perk = IsBannedPerkId(perk_id)
    local is_bannable_perk = ISBannablePerkId(perk_id)
    if is_banned_perk then
        perk_xml_path = "mods/noita-together/files/entities/perks/banned_perk.xml"
        perk_image_file_path = "mods/noita-together/files/items_gfx/banned_perks/" .. perk_id .. ".png"
    else
        perk_xml_path = "data/entities/items/pickup/perk.xml"
        perk_image_file_path = perk_data.perk_icon
    end

    local entity_id = EntityLoad(perk_xml_path, x, y)
    if (entity_id == nil) then
        return
    end

    local dont_remove_other_perks = dont_remove_other_perks_ or false

    -- init perk item
    EntityAddComponent(entity_id, "SpriteComponent",
        {
            image_file = perk_image_file_path or "data/items_gfx/perk.xml",
            offset_x = "8",
            offset_y = "8",
            update_transform = "1",
            update_transform_rotation = "0",
        })

    EntityAddComponent(entity_id, "UIInfoComponent",
        {
            name = perk_data.ui_name,
        })

    -- Only add ItemComponent which allows item pickup for non-banned perks
    if not is_banned_perk then
        EntityAddComponent(entity_id, "ItemComponent",
            {
                item_name = perk_data.ui_name,
                ui_description = perk_data.ui_description,
                ui_display_description_on_pick_up_hint = "1",
                play_spinning_animation = "0",
                play_hover_animation = "0",
                play_pick_sound = "0",
            })
    end

    EntityAddComponent(entity_id, "SpriteOffsetAnimatorComponent",
        {
            sprite_id = "-1",
            x_amount = "0",
            x_phase = "0",
            x_phase_offset = "0",
            x_speed = "0",
            y_amount = "2",
            y_speed = "3",
        })

    EntityAddComponent(entity_id, "VariableStorageComponent",
        {
            name = "perk_id",
            value_string = perk_data.id,
        })

    if dont_remove_other_perks then
        EntityAddComponent(entity_id, "VariableStorageComponent",
            {
                name = "perk_dont_remove_others",
                value_bool = "1",
            })
    end

    -- Add LuaComponent to all bannable perks
    -- script_source_file with a arbitrarily large execute_every_n_frame are used for performance considerations
    if is_bannable_perk then
        EntityAddComponent(entity_id, "LuaComponent",
            {
                script_source_file = "mods/noita-together/files/scripts/bannable_perk_check.lua",
                execute_every_n_frame = "300"
            })
    end

    return entity_id
end

-- NT_ban_perks - Do not allow banned perks to be picked up
--[[
Banned perks may exist in world from:
  Being spawned in world while the gameflag is off
  Handling of banned perks being toggled on may have removed a players existing perks and placed them into the world.
]]
local _perk_pickup = perk_pickup
function perk_pickup(entity_item, entity_who_picked, item_name, do_cosmetic_fx, kill_other_perks, no_perk_entity_)
    if (not GameHasFlagRun("NT_ban_perks")) then
        _perk_pickup(entity_item, entity_who_picked, item_name, do_cosmetic_fx, kill_other_perks, no_perk_entity_)
    else
        -- fetch perk info ---------------------------------------------------
        local no_perk_entity = no_perk_entity_ or false
        local pos_x, pos_y

        if no_perk_entity then
            pos_x, pos_y = EntityGetTransform(entity_who_picked)
        else
            pos_x, pos_y = EntityGetTransform(entity_item)
        end

        local perk_id = ""

        if no_perk_entity then
            perk_id = item_name
        else
            edit_component(entity_item, "VariableStorageComponent", function(comp, vars)
                perk_id = ComponentGetValue(comp, "value_string")
            end)
        end

        if IsBannedPerkId(perk_id) then
            --[[
              It should only be possible to enter this state if:
              A perk is forcibly applied through cheats
              The user attempts to pickup a perk, after NT_ban_perks is turned on, but before the next script execution of
              a perk entity which can be banned updates the perk entity
            ]]
            GamePrint("$noitatogether_banned_perk_pickup")
            local dont_remove_other_perks = not kill_other_perks
            EntityKill(entity_item)
            EntityLoad("data/entities/particles/polymorph_explosion.xml", pos_x, pos_y)
            perk_spawn(pos_x, pos_y, perk_id, dont_remove_other_perks)
        else
            _perk_pickup(entity_item, entity_who_picked, item_name, do_cosmetic_fx, kill_other_perks, no_perk_entity_)
        end
    end
end

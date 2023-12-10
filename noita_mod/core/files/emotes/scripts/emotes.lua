local this_entity = GetUpdatedEntityID()
local this_player = EntityGetRootEntity(this_entity)
local is_ghost = EntityGetWithTag("player_unit")[1] ~= this_player
local var_comps = EntityGetComponent(this_entity, "VariableStorageComponent")
local current_emote_var_comp = var_comps[1]
local emoting_now_var_comp = var_comps[2]
local active_item_var_comp = var_comps[3]
local frames_emoting_var_comp = var_comps[4]
local spawned_entity_var_comp = var_comps[5]
local emote_menu_open_var_comp = var_comps[6]
local invoke_locked_var_comp = var_comps[7]
local skin_var_comp = var_comps[8]
local previous_skin_var_comp = var_comps[9]
local particles_to_restore_comp = var_comps[10]
local current_emote = ComponentGetValue2(current_emote_var_comp, "value_string")
local emoting_now = ComponentGetValue2(emoting_now_var_comp, "value_bool")
local active_item = ComponentGetValue2(active_item_var_comp, "value_int")
local frames_emoting = ComponentGetValue2(frames_emoting_var_comp, "value_int")
local spawned_entity = ComponentGetValue2(spawned_entity_var_comp, "value_int")
local emote_menu_open = ComponentGetValue2(emote_menu_open_var_comp, "value_bool")
local invoke_locked = ComponentGetValue2(invoke_locked_var_comp, "value_bool")
local skin = ComponentGetValue2(skin_var_comp, "value_string")
local previous_skin = ComponentGetValue2(previous_skin_var_comp, "value_string")
local particles_to_restore = ComponentGetValue2(particles_to_restore_comp, "value_string")
dofile_once("mods/noita-together/files/emotes/scripts/emote_list.lua")
dofile_once("mods/noita-together/files/emotes/scripts/keys.lua")

function set_emote(emote)
    frames_emoting = 0
    emote_menu_open = false
    invoke_locked = true
    current_emote = emote
    update_multiplayer_apis("emote")
end

function set_skin(new_skin)
    skin = new_skin
    update_multiplayer_apis("skin")
end

function set_robe_color(color)
    local x, y = EntityGetTransform(this_player)

    --previous color particle effect
    local particle_entity = EntityLoad("mods/noita-together/files/emotes/entities/color_swap_particles.xml", x, y)
    EntityAddTag(particle_entity, previous_skin)
    EntityAddChild(this_player, particle_entity)

    --determine animation file paths
    local body_image_file = "data/enemies_gfx/player.xml"
    local arm_image_file = "data/enemies_gfx/player_arm.xml"
    local cape_entity_file = "data/entities/verlet_chains/cape/cape.xml"
    local emote_image_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml"
    if color ~= "purple" then
        body_image_file = "mods/noita-together/files/emotes/entities_gfx/player_" .. color .. ".xml"
        arm_image_file = "mods/noita-together/files/emotes/entities_gfx/player_arm_" .. color .. ".xml"
        cape_entity_file = "mods/noita-together/files/emotes/entities_gfx/cape_" .. color .. ".xml"
        emote_image_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_" .. color .. ".xml"
    end

    --swap main body sprite
    local body_sprite = EntityGetFirstComponentIncludingDisabled(this_player, "SpriteComponent", "lukki_disable")
    ComponentSetValue2(body_sprite, "image_file", body_image_file)

    --arm and cape
    local children = EntityGetAllChildren(this_player)
    for _, child in ipairs(children) do
        if EntityGetName(child) == "arm_r" then
            local arm_sprite = EntityGetFirstComponentIncludingDisabled(child, "SpriteComponent", "with_item")
            ComponentSetValue2(arm_sprite, "image_file", arm_image_file)
        end

        if EntityGetName(child) == "cape" then
            EntityKill(child)
            local cape = EntityLoad(cape_entity_file, x, y)
            EntitySetName(cape, "cape")
            EntityAddChild(this_player, cape)
        end

        if EntityGetName(child) == "emotes" then
            local emote_sprite = EntityGetFirstComponentIncludingDisabled(child, "SpriteComponent", "emote")
            if emote_sprite ~= nil then
                ComponentSetValue2(emote_sprite, "image_file", emote_image_file)
            end

            local emote_children = EntityGetAllChildren(child) or {}
            for _, emote_child in ipairs(emote_children) do
                if EntityGetName(emote_child) == "cape" then
                    EntityKill(emote_child)
                    local cape = EntityLoad(cape_entity_file, x, y)
                    EntitySetName(cape, "cape")
                    EntityAddChild(child, cape)
                end
            end
        end
    end
end

function start_emote()
    freeze_player()

    --kill spawned entity in case we're switching directly from one emote to another
    if spawned_entity ~= 0 then
        EntityKill(spawned_entity)
        spawned_entity = 0
    end

    --kill emote sprites in case we're switching directly from one emote to another
    local emote_sprites = EntityGetComponentIncludingDisabled(this_entity, "SpriteComponent") or {}
    for _, emote_sprite in ipairs(emote_sprites) do
        EntityRemoveComponent(this_entity, emote_sprite)
    end

    --hide body sprite during emote and reveal the emote version
    if emote_list[current_emote].player_animation_file ~= nil then
        --if(EntityGetName(this_entity) == "emotes_on_client")then
        --    local body_sprite = EntityGetFirstComponent(this_player, "SpriteComponent", "character")
        --    ComponentSetValue2(body_sprite, "visible", false)
        --else
            local body_sprite = EntityGetFirstComponent(this_player, "SpriteComponent", "lukki_disable")
            ComponentSetValue2(body_sprite, "visible", false)
        --end

        --animation file color variants
        print("skin: " .. tostring(skin))
        local image_file = emote_list[current_emote].player_animation_file
        if skin ~= "purple" then
            image_file = image_file:sub(1, -5)
            image_file = image_file .. "_" .. skin .. ".xml"
        end

        EntityAddComponent2(this_entity, "SpriteComponent", {
            _tags = "emote",
            image_file = image_file,
            z_index = 0.6,
            rect_animation = current_emote,
            next_rect_animation = current_emote
        })
    end

    --hide arm sprite during emote
    local children = EntityGetAllChildren(this_player)
    for _, child in ipairs(children) do
        if EntityGetName(child) == "arm_r" then
            local arm_sprite = EntityGetFirstComponent(child, "SpriteComponent", "with_item")
            ComponentSetValue2(arm_sprite, "visible", false)
        end
    end

    --get any enabled cosmetic sprites
    local player_hat2 = EntityGetFirstComponent(this_player, "SpriteComponent", "player_hat2")
    local player_amulet = EntityGetFirstComponent(this_player, "SpriteComponent", "player_amulet")
    local player_amulet_gem = EntityGetFirstComponent(this_player, "SpriteComponent", "player_amulet_gem")

    --for any enabled cosmetic sprites, hide the original and enable the emote equivalent
    if player_hat2 ~= nil then
        ComponentSetValue2(player_hat2, "visible", false)
        if emote_list[current_emote].crown_animation_file ~= nil then
            EntityAddComponent2(this_entity, "SpriteComponent", {
                image_file = emote_list[current_emote].crown_animation_file,
                z_index = 0.58,
                rect_animation = current_emote,
                next_rect_animation = current_emote
            })
        end
    end
    if player_amulet ~= nil then
        ComponentSetValue2(player_amulet, "visible", false)
        if emote_list[current_emote].amulet_animation_file ~= nil then
            EntityAddComponent2(this_entity, "SpriteComponent", {
                image_file = emote_list[current_emote].amulet_animation_file,
                z_index = 0.59,
                rect_animation = current_emote,
                next_rect_animation = current_emote
            })
        end
    end
    if player_amulet_gem ~= nil then
        ComponentSetValue2(player_amulet_gem, "visible", false)
        if emote_list[current_emote].gem_animation_file ~= nil then
            EntityAddComponent2(this_entity, "SpriteComponent", {
                image_file = emote_list[current_emote].gem_animation_file,
                z_index = 0.58,
                rect_animation = current_emote,
                next_rect_animation = current_emote
            })
        end
    end

    --hide active item
    local inventory_comp = EntityGetFirstComponentIncludingDisabled(this_player, "Inventory2Component")
        if inventory_comp ~= nil then
        active_item = ComponentGetValue2(inventory_comp, "mActualActiveItem")
        local sprite_comp = EntityGetFirstComponentIncludingDisabled(active_item, "SpriteComponent")
        if sprite_comp ~= nil then
            ComponentSetValue2(EntityGetFirstComponentIncludingDisabled(active_item, "SpriteComponent"), "visible", false)
        end
        --if active item is a wand, silence all spell particles during emote
        --local children = EntityGetAllChildren(active_item)
        --for _, child in ipairs(children) do
        --    
        --end
    elseif is_ghost then
        local children = EntityGetAllChildren(this_player)
        for _, child in ipairs(children) do
            if EntityGetName(child) == "held_item" then
                local sprite_comp = EntityGetFirstComponentIncludingDisabled(child, "SpriteComponent")
                ComponentSetValue2(sprite_comp, "visible", false)
            end
        end
    end

    --TODO: lukki considerations

    --spawned entity, if any
    if emote_list[current_emote].spawn_entity ~= nil then
        local player_x, player_y = EntityGetTransform(this_player)
        spawned_entity = EntityLoad(emote_list[current_emote].spawn_entity, player_x, player_y)
    end

    --parent the cape to the emote entity if the emote has a custom cape hotspot
    if emote_list[current_emote].custom_cape_hotspot then
        local cape = EntityGetWithName("cape")
        if cape ~= nil and not is_ghost then
            EntityRemoveFromParent(cape)
            EntityAddChild(this_entity, cape)
        end
    end

    --set emoting state to true
    emoting_now = true
end

function end_emote()
    unfreeze_player()

    --show body sprite
    --if(EntityGetName(this_entity) == "emotes_on_client")then
    --   local body_sprite = EntityGetFirstComponent(this_player, "SpriteComponent", "character")
    --   ComponentSetValue2(body_sprite, "visible", true)
    --else
       local body_sprite = EntityGetFirstComponent(this_player, "SpriteComponent", "lukki_disable")
       ComponentSetValue2(body_sprite, "visible", true)
   --end

   --show arm sprite
   local children = EntityGetAllChildren(this_player)
   for _, child in ipairs(children) do
       if EntityGetName(child) == "arm_r" then
           local arm_sprite = EntityGetFirstComponent(child, "SpriteComponent", "with_item")
           ComponentSetValue2(arm_sprite, "visible", true)
       end
   end

   --fix visibility of hidden item
   if active_item ~= 0 then
       local sprite_comp = EntityGetFirstComponentIncludingDisabled(active_item, "SpriteComponent")
       if sprite_comp ~= nil then
           ComponentSetValue2(EntityGetFirstComponentIncludingDisabled(active_item, "SpriteComponent"), "visible", true)
       end
       active_item = 0
   elseif is_ghost then
       local children = EntityGetAllChildren(this_player)
       for _, child in ipairs(children) do
           if EntityGetName(child) == "held_item" then
               local sprite_comp = EntityGetFirstComponentIncludingDisabled(child, "SpriteComponent")
               ComponentSetValue2(sprite_comp, "visible", true)
           end
       end
   end

   --reveal any enabled player cosmetics
   local player_hat2 = EntityGetFirstComponent(this_player, "SpriteComponent", "player_hat2")
   local player_amulet = EntityGetFirstComponent(this_player, "SpriteComponent", "player_amulet")
   local player_amulet_gem = EntityGetFirstComponent(this_player, "SpriteComponent", "player_amulet_gem")
   if player_hat2 ~= nil then
       ComponentSetValue2(player_hat2, "visible", true)
   end
   if player_amulet ~= nil then
       ComponentSetValue2(player_amulet, "visible", true)
   end
   if player_amulet_gem ~= nil then
       ComponentSetValue2(player_amulet_gem, "visible", true)
   end

   --kill the spawned entity
   if spawned_entity ~= 0 then
       EntityKill(spawned_entity)
       spawned_entity = 0
   end

   --parent the cape back to the player if it was moved
   local cape = EntityGetWithName("cape")
   if cape ~= nil and not is_ghost then
       local cape_parent = EntityGetParent(cape)
       if cape_parent ~= this_player then
           EntityRemoveFromParent(cape)
           EntityAddChild(this_player, cape)
       end
   end

   --hide and reset emote sprite
   local emote_sprites = EntityGetComponentIncludingDisabled(this_entity, "SpriteComponent")
   for _, emote_sprite in ipairs(emote_sprites) do
       EntityRemoveComponent(this_entity, emote_sprite)
   end

   --set emoting state to false
   emoting_now = false
   frames_emoting = 0
end

--is the player breaking out of the emote
local function break_emote()
    local controls_comp = EntityGetFirstComponentIncludingDisabled(this_player, "ControlsComponent")
    if emote_menu_invoked == false
    and (
        ComponentGetValue2(controls_comp, "mButtonDownLeft")
        or ComponentGetValue2(controls_comp, "mButtonDownRight")
        or ComponentGetValue2(controls_comp, "mButtonDownDown")
        or ComponentGetValue2(controls_comp, "mButtonDownUp")
        or ComponentGetValue2(controls_comp, "mButtonDownFire")
    ) then
        return true
    end
    return false
end

if (not is_ghost) then
    gui = gui or GuiCreate()
    gui_id = 0
    GuiStartFrame(gui)
    GuiOptionsAdd(gui, 2)
    GuiOptionsAdd(gui, 6)
end

local function reset_gui_id()
    gui_id = 0
end

local function next_gui_id()
    local id = gui_id
    gui_id = gui_id + 1
    return id
end

--draws a horizontally-centered emote menu just below middle of screen
local function draw_emote_menu()
    GuiIdPushString(gui, "emote_menu")
    GuiOptionsRemove(gui, 2)
    reset_gui_id()
    local emote_list_count = 0
    for _ in pairs(emote_list) do emote_list_count = emote_list_count + 1 end
    local screen_width, screen_height = GuiGetScreenDimensions(gui)
    local middle_x, middle_y = screen_width * 0.5, screen_height * 0.5

    --arbitrary breakpoints for adding new rows to the menu
    local rows = 1
    if emote_list_count >= 8 then rows = 2
    elseif emote_list_count >= 21 then rows = 3
    elseif emote_list_count >= 31 then rows = 4
    end

    local icons_per_row = math.ceil(emote_list_count / rows)
    local icon_count = 1
    local start_x = middle_x - (icons_per_row * 20 * 0.5)
    local x = start_x
    local y = middle_y + 20

    --emote buttons
    for index, emote in pairs(emote_list) do
        GuiZSetForNextWidget(gui, 8)
        if GuiImageButton(gui, next_gui_id(), x, y, "", emote.gui_icon) then
            set_emote(index)
        end
        GuiTooltip(gui, emote.gui_name, "")

        x = x + 20
        icon_count = icon_count + 1

        --start the next row
        if icon_count > icons_per_row then
            x = start_x
            --if the parity (odd or even count) of the last row is different from the other rows,
            --then offset it by 10 pixels to keep it centered
            if (emote_list_count - icon_count + 1) < icons_per_row then
                local icons_per_row_partiy = icons_per_row / 2
                local remianing_icons_parity = (emote_list_count - icon_count) / 2
                if icons_per_row_partiy ~= remianing_icons_parity then
                    x = x + 10
                end
            end
            y = y + 20
            icon_count = 1
        end
    end

    --color buttons
    x = middle_x
    if icon_count >= icons_per_row then y = y + 20 end
    if GuiImageButton(gui, next_gui_id(), x - 30, y, "", "mods/noita-together/files/emotes/ui_gfx/icons/color_red.png") then set_skin("red") end
    GuiTooltip(gui, "Red Robes", "")
    if GuiImageButton(gui, next_gui_id(), x - 20, y, "", "mods/noita-together/files/emotes/ui_gfx/icons/color_orange.png") then set_skin("orange") end
    GuiTooltip(gui, "Orange Robes", "")
    if GuiImageButton(gui, next_gui_id(), x - 10, y, "", "mods/noita-together/files/emotes/ui_gfx/icons/color_yellow.png") then set_skin("yellow") end
    GuiTooltip(gui, "Yellow Robes", "")
    if GuiImageButton(gui, next_gui_id(), x, y, "", "mods/noita-together/files/emotes/ui_gfx/icons/color_green.png") then set_skin("green") end
    GuiTooltip(gui, "Green Robes", "")
    if GuiImageButton(gui, next_gui_id(), x + 10, y, "", "mods/noita-together/files/emotes/ui_gfx/icons/color_blue.png") then set_skin("blue") end
    GuiTooltip(gui, "Blue Robes", "")
    if GuiImageButton(gui, next_gui_id(), x + 20, y, "", "mods/noita-together/files/emotes/ui_gfx/icons/color_purple.png") then set_skin("purple") end
    GuiTooltip(gui, "Purple Robes", "")

    GuiIdPop(gui)
end

--boolean is the player invoking the emote menu
local function get_emote_menu_invoked()
    if not ModSettingGet("noita-together.NT_SHOW_EMOTES") then return false end

    --M-Nee input
    if ModIsEnabled("mnee") then
		dofile_once("mods/mnee/lib.lua")
		if is_binding_down("emotes", "emote_menu") then
			return true
		end
    --Native input
	elseif has_input_api() then
        local binding = ModSettingGet("noita-together.NT_EMOTE_BINDING")
        local key_binds = {}
        local mouse_binds = {}
        local joy_binds = {}
        local mode = "key_code"
        for code in string.gmatch(binding, "[^,]+") do
            if code == "mouse_code" or code == "key_code" or code == "joystick_code" then
                mode = code
            else
                code = tonumber(code)
                if mode == "key_code" then
                    table.insert(key_binds, code)
                elseif mode == "mouse_code" then
                    table.insert(mouse_binds, code)
                elseif mode == "joystick_code" then
                    table.insert(joy_binds, code)
                end
            end
        end
        local triggered = true
        for _, code in pairs(key_binds) do
            if not InputIsKeyDown(code) then
                triggered = false
            end
        end
        for _, code in pairs(mouse_binds) do
            if not InputIsMouseButtonDown(code) then
                triggered = false
            end
        end
        for _, code in pairs(joy_binds) do
            if not InputIsJoystickButtonDown(0, code) then
                triggered = false
            end
        end
        return triggered
    --Pre-Summer 2023 API update, input via ControlsComponent
    else
        local controls_comp = EntityGetFirstComponentIncludingDisabled(this_player, "ControlsComponent")
        if ComponentGetValue2(controls_comp, "mButtonDownLeft")
        and ComponentGetValue2(controls_comp, "mButtonDownRight")
        and ComponentGetValue2(controls_comp, "mButtonDownDown") then
            return true
        end
    end
    return false
end

--send emote notification to any multiplayer frameworks currently enabled
function update_multiplayer_apis(type)
    if is_ghost then return end
    dofile("mods/noita-together/files/emotes/scripts/multiplayer_apis.lua")
    if type == "emote" then
        send_emote(current_emote)
    elseif type == "skin" then
        send_skin_swap(skin)
    end
end

--has summer 2023 update mod api input functions
function has_input_api()
    return (type(InputIsKeyDown) == "function") ~= false
end

function freeze_player()
    if is_ghost then return end
    ComponentSetValue2(platforming_comp, "run_velocity", 0)
    ComponentSetValue2(platforming_comp, "mouse_look", false)
    local body_sprite = EntityGetFirstComponentIncludingDisabled(this_player, "SpriteComponent", "lukki_disable")
    ComponentSetValue2(body_sprite, "rect_animation", "stand")
    local lukki_sprite = EntityGetFirstComponentIncludingDisabled(this_player, "SpriteComponent", "lukki_enable")
    ComponentSetValue2(lukki_sprite, "rect_animation", "stand")
    local crown_sprite = EntityGetFirstComponentIncludingDisabled(this_player, "SpriteComponent", "player_hat2")
    ComponentSetValue2(crown_sprite, "rect_animation", "stand")
    local amulet_sprite = EntityGetFirstComponentIncludingDisabled(this_player, "SpriteComponent", "player_amulet")
    ComponentSetValue2(amulet_sprite, "rect_animation", "stand")
    local gem_sprite = EntityGetFirstComponentIncludingDisabled(this_player, "SpriteComponent", "player_amulet_gem")
    ComponentSetValue2(gem_sprite, "rect_animation", "stand")
end

function unfreeze_player()
    if is_ghost then return end
    ComponentSetValue2(platforming_comp, "run_velocity", 154)
    ComponentSetValue2(platforming_comp, "mouse_look", true)
end

--poll the emote input
emote_menu_invoked = get_emote_menu_invoked()

--grab platforming comp here since we're almost inevitably going to need to reference it somewhere below
platforming_comp = EntityGetFirstComponentIncludingDisabled(this_player, "CharacterPlatformingComponent")

if not ModSettingGet("noita-together.NT_SHOW_EMOTES") then
    if current_emote ~= "none" then set_emote("none") end
    if skin ~= "purple" then set_skin("purple") end
end

--emote menu
if not is_ghost then
    if emote_menu_open and not emote_menu_invoked then
        local x, y = EntityGetTransform(this_entity)
        GamePlaySound("data/audio/Desktop/ui.bank", "ui/inventory_close", x, y)
    end

    if emote_menu_invoked and not emote_menu_open and not invoke_locked then
        emote_menu_open = true
        local x, y = EntityGetTransform(this_entity)
        GamePlaySound("data/audio/Desktop/ui.bank", "ui/inventory_open", x, y)
    elseif not emote_menu_invoked or invoke_locked then
        emote_menu_open = false
    end

    --on key up after an emote selection, unlock for another invoke
    if not emote_menu_invoked and invoke_locked then
        invoke_locked = false
    end

    if emote_menu_open then
        draw_emote_menu()
        
        --freeze movement and set animation default while selecting an emote
        --if older api version without native keybinds and no m-nee
        --as invoking the emote menu requires using movement controls
        if not has_input_api() and not ModIsEnabled("mnee") then
            freeze_player()
        end
    else
        if not has_input_api() and not ModIsEnabled("mnee") and not emoting_now then
            unfreeze_player()
        end
    end
end

if current_emote == "none" then
    --since no emote is set, stop emoting if we are
    if emoting_now then
        end_emote()
    end
else
    frames_emoting = frames_emoting + 1
    if not is_ghost then
        local controls_comp = EntityGetFirstComponentIncludingDisabled(this_player, "ControlsComponent")
        local delta_x, delta_y = ComponentGetValue2(controls_comp, "mMouseDelta")
        if not is_ghost and (delta_x > 1 or delta_y > 1) then
            ComponentSetValue2(platforming_comp, "mouse_look", true)
        end
    end

    --end a non-looping emote when it's done
    if emote_list[current_emote].frames >= 1 and frames_emoting - 1 > emote_list[current_emote].frames then
        current_emote = "none"
        --[[if not is_ghost then
            reset_emote_store_for_multiplayer_apis(current_emote)
        end]]
    end

    --start the emote 1 frame after it's selected
    if frames_emoting == 1 then
        start_emote(current_emote)
    end

    --after 15 frames the player is allowed to break out of the emote,
    --so long as it's also been 15 frames (debounce period) since they were last holding down the emote key combo
    if frames_emoting > 15 and not is_ghost then
        if break_emote() then
            current_emote = "none"
            update_multiplayer_apis("emote")
        end
    end
end

if skin ~= previous_skin then
    --potential to support more skins in future, for now just doing six robe colors (skin = red / orange / yellow / green / blue / purple)
    set_robe_color(skin)
    previous_skin = skin
end

ComponentSetValue2(current_emote_var_comp, "value_string", current_emote)
ComponentSetValue2(emoting_now_var_comp, "value_bool", emoting_now)
ComponentSetValue2(active_item_var_comp, "value_int", active_item)
ComponentSetValue2(frames_emoting_var_comp, "value_int", frames_emoting)
ComponentSetValue2(spawned_entity_var_comp, "value_int", spawned_entity)
ComponentSetValue2(emote_menu_open_var_comp, "value_bool", emote_menu_open)
ComponentSetValue2(invoke_locked_var_comp, "value_bool", invoke_locked)
ComponentSetValue2(skin_var_comp, "value_string", skin)
ComponentSetValue2(previous_skin_var_comp, "value_string", previous_skin)
ComponentSetValue2(particles_to_restore_comp, "value_string", particles_to_restore)
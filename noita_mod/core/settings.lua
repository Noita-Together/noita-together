dofile("data/scripts/lib/mod_settings.lua")
dofile("mods/noita-together/files/emotes/scripts/keys.lua")

local mod_id = "noita-together"
mod_settings_version = 2
mod_settings = 
{
	{
		id = "NT_HINTS",
		ui_name = "Show hints",
		value_default = true,
		scope=MOD_SETTING_SCOPE_RUNTIME
	},
	{
		id = "NT_NO_STAT_PROGRESS",
		ui_name = "Disable progress",
		ui_description = "Disable progress tracking of perks, spells and enemies",
		value_default = false,
 		scope=MOD_SETTING_SCOPE_RUNTIME
	},
	{
		id = "NT_FOLLOW_DEFAULT",
		ui_name = "Player ghost enabled by default",
		value_default = false,
		scope=MOD_SETTING_SCOPE_RUNTIME
	},
	{
		id = "NT_GHOST_OPACITY",
		ui_name = "Player ghost opacity",
		value_default = 1.0,
		value_min = 0.0,
		value_max = 1.0,
		value_display_multiplier = 100,
		scope=MOD_SETTING_SCOPE_RUNTIME
	},
	{
		id = "NT_ENABLE_LOGGER",
		ui_name = "Enable Logger (Debug)",
		ui_description = "Enable debug logging. logger.txt lives in the Noita install directory.\nIt is NOT automatically shared with NT developers.",
		value_default = true,
		scope=MOD_SETTING_SCOPE_RUNTIME_RESTART --this doesnt actually seem to prompt the user to restart the game though ??
	},
	{
		id = "NT_SHOW_WUOTE_FRIDGE",
		ui_name = "Use fridge icon",
		value_default = false,
		scope=MOD_SETTING_SCOPE_RUNTIME
	},
	{
		id = "NT_SHOW_EMOTES",
		ui_name = "Emotes system",
		ui_description = "Enable visibility of player emotes and color swaps, as well as the in-game emotes menu.",
		value_default = true,
		scope=MOD_SETTING_SCOPE_RUNTIME
	},
	{
		id = "NT_EMOTE_BINDING",
		value_default = "key_code,20,mouse_code,joystick_code",
		hidden = true,
		scope=MOD_SETTING_SCOPE_RUNTIME
	}
}

--support vars for dynamic emote keybind system
local input_apis_present = (type(InputIsKeyDown) == "function") ~= false
local listening = false
local there_has_been_input = false
local key_inputs = {}
local mouse_inputs = {}
local joystick_inputs = {}
local old_binding = "key_code,20,mouse_code,joystick_code"
if ModSettingGet("noita-together.NT_EMOTE_BINDING") ~= nil then
	old_binding = ModSettingGet("noita-together.NT_EMOTE_BINDING")
end

function ModSettingsUpdate( init_scope )
	mod_settings_update( mod_id, mod_settings, init_scope )
end

function ModSettingsGuiCount()
	return mod_settings_gui_count( mod_id, mod_settings )
end

function ModSettingsGui( gui, in_main_menu )
	mod_settings_gui( mod_id, mod_settings, gui, in_main_menu )

	if input_apis_present then
		if listening then
			input_listen()
		end

		local keybind_string = ""
		local keybind_setting = ModSettingGet("noita-together.NT_EMOTE_BINDING")
		local mode = "key_code"
		for code in string.gmatch(keybind_setting, "[^,]+") do
			if code == "mouse_code" or code == "key_code" or code == "joystick_code" then
				mode = code
			else
				if keybind_string ~= "" then
					keybind_string = keybind_string .. " + "
				end
				code = tonumber(code)
				if mode == "key_code" then
					for key, value in pairs(key_codes) do
						if value == code then
							keybind_string = keybind_string .. key
						end
					end
				elseif mode == "mouse_code" then
					for key, value in pairs(mouse_codes) do
						if value == code then
							keybind_string = keybind_string .. key
						end
					end
				elseif mode == "joystick_code" then
					for key, value in pairs(joystick_codes) do
						if value == code then
							keybind_string = keybind_string .. key
						end
					end
				end
			end
		end

		if listening then
			GuiColorSetForNextWidget(gui, 1, 0, 0, 1)
			GuiOptionsAdd(gui, GUI_OPTION.NonInteractive)
		end
		GuiOptionsAdd(gui, GUI_OPTION.Layout_NextSameLine)
		if GuiButton(gui, 9999, 0, 0, "Current emote binding: ") then
			key_inputs = {}
			mouse_inputs = {}
			joystick_inputs = {}
			listening = true
			there_has_been_input = false
			old_binding = ModSettingGet("noita-together.NT_EMOTE_BINDING")
		end
		GuiTooltip(gui, "Set a custom binding for emotes to any combination of mouse, keyboard, and gamepad inputs."
		.."\nAlso supports M-Néé input customization.", "")
		GuiText(gui, 90, 0, keybind_string)
		GuiOptionsRemove(gui, GUI_OPTION.Layout_NextSameLine)
		GuiLayoutAddVerticalSpacing(gui, 10)
	else
		GuiColorSetForNextWidget(gui, 1, 1, 1, 0.5)
    	GuiText(gui, 0, 0, "Current emote binding: A+S+D")
		GuiTooltip(gui, "Native input customization is only supported on the Noita beta branch!"
			.."\nFor now, use the M-Néé input customization mod."
			.."\n(And list M-Néé above other mods in the Mods Menu)", "")
	end
end

--keybind listener that uses new Noita input lua functions
function input_listen()
    local there_is_input = false
    for _, code in pairs(key_codes) do
        if InputIsKeyDown(code) then
            there_is_input = true
            there_has_been_input = true
            if has_value(key_inputs, code) == false then
                table.insert(key_inputs, code)
            end
        end
    end
    for _, code in pairs(mouse_codes) do
        if InputIsMouseButtonDown(code) then
            there_is_input = true
            there_has_been_input = true
            if has_value(mouse_inputs, code) == false then
                table.insert(mouse_inputs, code)
            end
        end
    end
    for _, code in pairs(joystick_codes) do
        if InputIsJoystickButtonDown(0, code) then
            there_is_input = true
            there_has_been_input = true
            if has_value(joystick_inputs, code) == false then
                table.insert(joystick_inputs, code)
            end
        end
    end

    local binding = "key_code,"
    for _, code in pairs(key_inputs) do
        binding = binding .. tostring(code) .. ","
    end
    binding = binding .. "mouse_code,"
    for _, code in pairs(mouse_inputs) do
        binding = binding .. tostring(code) .. ","
    end
    binding = binding .. "joystick_code,"
    for _, code in pairs(joystick_inputs) do
        binding = binding .. tostring(code) .. ","
    end
    binding = binding:sub(1, -2)
	ModSettingSet("noita-together.NT_EMOTE_BINDING", binding)
	ModSettingSetNextValue("noita-together.NT_EMOTE_BINDING", binding, false)

    if there_has_been_input and not there_is_input then
        listening = false
        there_has_been_input = false
        key_inputs = {}
        mouse_inputs = {}
        joystick_inputs = {}
        if ModSettingGet("noita-together.NT_EMOTE_BINDING") == "key_code,mouse_code,joystick_code" then
            ModSettingSet("noita-together.NT_EMOTE_BINDING", old_binding)
        end
    end
end

function has_value(table, value)
    for _, v in ipairs(table) do
        if v == value then
            return true
        end
    end
    return false
end

-- MODDERS: PLEASE DO NOT ALTER THIS FILE. IT IS USED TO WARN ABOUT INCOMPATIBLE MODS!
-- IF YOUR MOD SHOWS UP HERE, FIND US ON GITHUB AND CREATE AN ISSUE EXPLAINING WHY YOUR MOD SHOULD NOT BE LISTED HERE

local incompatible_mods = nil
local problem_mods = nil

if not incompatible_mods then
    incompatible_mods = {}
    --incompatible_mods["example"] = { reason = "example mod, intentionally failing test :)", test_function = nil }

    --WUOTE NT-FRIDGE: replaces the entire ui.lua file, i suggest you use gsub to replace only the png path and use the translations support to replace the appropriate text keys --kabby
    incompatible_mods["NT-FRIDGE"] = { reason = "Replaces entire ui.lua, pls use translations and gsub for png path replace", test_function = nil }

    --kabby nt-kabby-skye-backports: redundant when running skye NT :)
    incompatible_mods["nt-kabby-skye-backports"] = { reason = "You are already running Skye NT and don't need this!", test_function = nil }

    --faintsnov nemesis-fix: fixes are integrated
    --TODO: not all fixes are actually implemented yet!
    --incompatible_mods["nemesis-fix"] = { reason = "Obsolete", test_function = nil }
end

--check the active mod list for incompatible mods, fill out problem_mods, and return true if any problems
function test_incompatible_mods()
    local mod_list = ModGetActiveModIDs()
    problem_mods = {}

    for _, v in ipairs(mod_list) do
        local im = incompatible_mods[v]
        if im then
            --always bad if no test function, otherwise bad if test function returns true
            if not im.test_function or im.test_function() then
                table.insert(problem_mods, v)
                print_error("(NT:ui_mod_warning.lua) incompatible mod active: \"" .. v .. "\" (" .. im.reason .. ")")
            end
        end
    end

    return #problem_mods > 0
end

if ui_mod_warning_initialized == nil then ui_mod_warning_initialized = false; end

if not ui_mod_warning_initialized then
    local gui = gui or GuiCreate();
    GuiStartFrame( gui );
    local screen_width, screen_height = GuiGetScreenDimensions(gui)

    local menuOpen = false
    local gui_id = 0

    ui_mod_warning_initialized = true

    local close = false

    local function next_id()
        local id = gui_id
        gui_id = gui_id + 1
        return id
    end

    function draw_gui_mod_warning()
        gui_id = 6969
        GuiStartFrame(gui)
        GuiIdPushString( gui, "noita_together_incompatibility_warning")

        GuiZSetForNextWidget(gui, 10)
        GuiImageNinePiece(gui, next_id(), screen_width / 5, screen_height / 5, (screen_width * 3) / 5, (screen_height * 3) / 5, 1, "mods/noita-together/files/ui/outer.png")

        GuiZSetForNextWidget(gui, 9)
        GuiText(gui, screen_width / 5 + 8, screen_height / 5 + 8, "$noitatogether_mod_incompatibility_title")
        
        local y = screen_height / 5 + 24
        for i, v in ipairs(problem_mods) do
            GuiText(gui, screen_width / 5 + 16, y, "" .. v .. " : " .. incompatible_mods[v].reason)
            y = y + 16

            --can't fit more than this many
            if i > 5 then
                GuiText(gui, screen_width / 5 + 16, y, "" .. #problem_mods - i .. " more" )
                break
            end
        end

        if (GuiImageButton(gui, next_id(), (screen_width * 4) / 5 - 12, screen_height / 5, "", "mods/noita-together/files/ui/close.png")) then
            close = true
        end

        GuiIdPop(gui)

        return close
    end
end
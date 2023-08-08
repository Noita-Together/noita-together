dofile("mods/noita-together/files/scripts/hourglass_events.lua")

local _spawn_hourglass_blood = spawn_hourglass_blood

function spawn_hourglass_blood(x, y)
    if (GameHasFlagRun("NT_GAMEMODE_CO_OP")) then
        --GamePrint("" .. type(hourglassEventHandlers["charm"]) .. " " .. type(hourglassEventHandlers["berserk"]))
        for e,v in pairs(hourglassEventHandlers) do
            --GamePrint("hourglass " .. e .. " " .. v["material"])
            CreateHourglassEntity(x, y+2, e, v["material"])
        end
    end
    _spawn_hourglass_blood(x, y)
end
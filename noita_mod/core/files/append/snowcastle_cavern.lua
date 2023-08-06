dofile("mods/noita-together/files/scripts/hourglass_events.lua")

local _spawn_hourglass_blood = spawn_hourglass_blood

function spawn_hourglass_blood(x, y)
    if (GameHasFlagRun("NT_GAMEMODE_CO_OP")) then
        --GamePrint("" .. type(hourglassEventHandlers["charm"]) .. " " .. type(hourglassEventHandlers["berserk"]))
        for e,v in pairs(hourglassEventHandlers) do
            --GamePrint("hourglass " .. e .. " " .. v["material"])
            CreateHourglassEntity(x, y+2, e, v["material"])
        end
        --[[EntityLoad( "mods/noita-together/files/entities/hourglass_ambrosia.xml", x, y+2 )
        EntityLoad( "mods/noita-together/files/entities/hourglass_berserk.xml", x, y )
        EntityLoad( "mods/noita-together/files/entities/hourglass_charm.xml", x, y )
        EntityLoad( "mods/noita-together/files/entities/hourglass_confusion.xml", x, y )
        EntityLoad( "mods/noita-together/files/entities/hourglass_speed.xml", x, y )]]--
    end
    _spawn_hourglass_blood(x, y)
end
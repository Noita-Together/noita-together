dofile_once("mods/noita-together/files/store.lua")
dofile_once("mods/noita-together/files/scripts/json.lua")
dofile_once("data/scripts/perks/perk.lua")
-- NT_ban_perks --
dofile_once("mods/noita-together/files/scripts/ban_perks.lua")

local _item_pickup = item_pickup

function item_pickup(entity_item, entity_who_picked, item_name)
    local list = dofile("mods/noita-together/files/scripts/perks.lua")
    local key_perk_components = GetKeyPerkComponents(entity_item)
    local perk_id = key_perk_components.perk_id
    local blocked = key_perk_components.nt_dont_share
    local banned_perk = IsBannedPerkId(perk_id)

    if (GameHasFlagRun("NT_GAMEMODE_CO_OP") and not blocked and not banned_perk) then
        if ((GameHasFlagRun("NT_team_perks") and list[perk_id] == true) or GameHasFlagRun("NT_sync_perks")) then
            local queue = json.decode(NT.wsQueue)
            table.insert(queue, { event = "CustomModEvent", payload = { name = "TeamPerk", id = perk_id } })
            NT.wsQueue = json.encode(queue)
            GamePrint("$noitatogether_teamperk_was_shared")
        end
    end
    _item_pickup(entity_item, entity_who_picked, item_name)
end

dofile_once("data/scripts/lib/utilities.lua")
dofile_once("data/scripts/perks/perk.lua")
-- NT_ban_perks --
dofile_once("mods/noita-together/files/scripts/ban_perks.lua")

local entity_item = GetUpdatedEntityID()
local x, y = EntityGetTransform(entity_item)
local key_perk_components = GetKeyPerkComponents(entity_item)
local perk_id = key_perk_components.perk_id
local is_banned = IsBannedPerkId(perk_id)
local item_components = EntityGetComponent(entity_item, "ItemComponent")
local is_pickable = item_components ~= nil
local nt_dont_share = key_perk_components.nt_dont_share


--[[
  Update in world entities that are associated with a bannable perk
  Real perks that can be picked up and are banned are converted to banned perk entities
  Banned perk entities which are no longer banned are converted to real perks
]]
if (is_pickable and is_banned) or (not is_pickable and not is_banned) then
    EntityKill(entity_item)
    EntityLoad("data/entities/particles/polymorph_explosion.xml", x, y)
    local spawned_entity = perk_spawn(x, y, perk_id, key_perk_components.dont_remove_other_perks)
    -- Ensure any additional required components from other NT options are added to the new entity
    if (spawned_entity ~= nil and nt_dont_share) then
        EntityAddComponent(spawned_entity, "VariableStorageComponent",
            {
                name = "NT_DONT_SHARE",
                value_string = "",
            })
    end
end

-- Returns a table of all possible banned perk_list.id string values
function AllPotentialBannedPerksTable()
    local banned_perks = {
        "GLASS_CANNON"
    }
    return banned_perks
end

-- Returns a table of banned perk_list.id string values
-- Separated to allow for potential selections or sets changes via app events in future
function BannedPerksTable()
    -- Table of perk_list.id strings to be banned.
    local banned_perks = {
        "GLASS_CANNON"
    }
    return banned_perks
end

-- Returns if a perk_id is currently banned
function IsBannedPerkId(perk_id)
    if (not GameHasFlagRun("NT_ban_perks")) then
        return false
    end
    for _, _perk_id in ipairs(BannedPerksTable()) do
        if _perk_id == perk_id then
            return true
        end
    end
    return false
end

-- Returns is a perk_id could be banned
function ISBannablePerkId(perk_id)
    for _, _perk_id in ipairs(AllPotentialBannedPerksTable()) do
        if _perk_id == perk_id then
            return true
        end
    end
    return false
end

-- Returns all repeatedly utilized VariableStorageComponent values to avoid multiple iterations across components
function GetKeyPerkComponents(entity_item)
    local components = EntityGetComponent(entity_item, "VariableStorageComponent")
    local perk_id
    local dont_remove_other_perks
    local nt_dont_share
    if (components ~= nil) then
        for key, comp_id in pairs(components) do
            local var_name = ComponentGetValue(comp_id, "name")
            if (var_name == "perk_id") then
                perk_id = ComponentGetValue2(comp_id, "value_string")
            end
            if (var_name == "perk_dont_remove_others") then
                dont_remove_other_perks = ComponentGetValue2(comp_id, "value_bool")
            end
            if (var_name == "NT_DONT_SHARE") then
                nt_dont_share = true
            end
        end
    end
    local perk_components = {
        perk_id = perk_id,
        dont_remove_other_perks = dont_remove_other_perks,
        nt_dont_share = nt_dont_share
    }
    return perk_components
end

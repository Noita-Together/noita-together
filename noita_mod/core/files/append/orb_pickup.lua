dofile_once("mods/noita-together/files/store.lua")
dofile_once("mods/noita-together/files/scripts/json.lua")
_item_pickup = _item_pickup or item_pickup

_EntityLoad = _EntityLoad or EntityLoad

function item_pickup(entity_item, entity_who_picked, name)
    if (GameHasFlagRun("NT_sync_orbs") and EntityHasTag(entity_item, "fake_orb") == false) then
        local orbcomp = EntityGetFirstComponent(entity_item, "OrbComponent")
        local orb_id = -1
        orb_id = ComponentGetValue2(orbcomp, "orb_id")

        local queue = json.decode(NT.wsQueue)
        table.insert(queue, {event="PlayerPickup", payload={orb={id=orb_id}}})
        NT.wsQueue = json.encode(queue)
    end
    _item_pickup(entity_item, entity_who_picked, name)
end

--hook EntityLoad to inject fake_orb tag onto spawned heart
function EntityLoad(filename, pos_x, pos_y)
    local entity_id = _EntityLoad(filename, pos_x, pos_y)
    if filename == "data/entities/items/pickup/heart.xml" then
        EntityAddTag(entity_id,"fake_orb")
        --nt print_error("inject fake_orb tag into orb heart OK")
    end
    return entity_id
end

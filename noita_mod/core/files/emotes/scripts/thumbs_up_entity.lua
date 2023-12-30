local entity_id = GetUpdatedEntityID()
local x, y = EntityGetTransform(entity_id)
local sprite = EntityGetFirstComponentIncludingDisabled(entity_id, "SpriteComponent")
local lua = EntityGetFirstComponentIncludingDisabled(entity_id, "LuaComponent")
local times_run = ComponentGetValue2(lua, "mTimesExecuted")

if times_run == 0 then
    x = x - 10
    y = y - 28
end

if times_run >= 16 and times_run < 30 then
    local alpha = ComponentGetValue2(sprite, "alpha")
    if alpha < 0.7 then
        alpha = alpha + 0.1
    end
    ComponentSetValue2(sprite, "alpha", alpha)
end

if times_run >= 50 then
    local alpha = ComponentGetValue2(sprite, "alpha")
    if alpha > 0 then
        alpha = alpha - 0.1
    end
    ComponentSetValue2(sprite, "alpha", alpha)
end

EntitySetTransform(entity_id, x, y - 0.25)
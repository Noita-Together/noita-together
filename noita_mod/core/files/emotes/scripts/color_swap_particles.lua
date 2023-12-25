local entity_id = GetUpdatedEntityID()
local particle_component = EntityGetFirstComponentIncludingDisabled(entity_id, "ParticleEmitterComponent")
local lua = EntityGetFirstComponentIncludingDisabled(entity_id, "LuaComponent")
local times_run = ComponentGetValue2(lua, "mTimesExecuted")

if times_run == 0 then
    --local x, y = EntityGetTransform(entity_id)
    --EntitySetTransform(entity_id, x, y - 5)

    local material_name = "spark_player"
    if EntityHasTag(entity_id, "red") then material_name = "spark_red" end
    if EntityHasTag(entity_id, "orange") then material_name = "fire" end
    if EntityHasTag(entity_id, "yellow") then material_name = "spark_yellow" end
    if EntityHasTag(entity_id, "green") then material_name = "grass" end
    if EntityHasTag(entity_id, "blue") then material_name = "spark_blue_dark" end
    --local material_name = "spark_" .. color

    ComponentSetValue2(particle_component, "emitted_material_name", material_name)
end

if times_run > 25 then
    EntityKill(entity_id)
end
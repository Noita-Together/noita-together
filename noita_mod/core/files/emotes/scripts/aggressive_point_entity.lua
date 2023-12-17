local entity_id = GetUpdatedEntityID()
local particle_emitter = EntityGetFirstComponentIncludingDisabled(entity_id, "ParticleEmitterComponent")
local sprite_emitter = EntityGetFirstComponentIncludingDisabled(entity_id, "SpriteParticleEmitterComponent")
local lua = EntityGetFirstComponentIncludingDisabled(entity_id, "LuaComponent")
local times_run = ComponentGetValue2(lua, "mTimesExecuted")

if times_run == 0 then
    local x, y = EntityGetTransform(entity_id)
    EntitySetTransform(entity_id, x, y - 10)
end

if times_run > 68 and times_run < 83 then
    --GamePrint(tostring(times_run))
    ComponentSetValue2(particle_emitter, "is_emitting", true)
    ComponentSetValue2(sprite_emitter, "is_emitting", true)
end

if times_run >= 83 then
    ComponentSetValue2(particle_emitter, "is_emitting", false)
    ComponentSetValue2(sprite_emitter, "is_emitting", false)
end
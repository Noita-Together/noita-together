local entity_id = GetUpdatedEntityID()
local x, y = EntityGetTransform(entity_id)
local particle_emitter = EntityGetFirstComponentIncludingDisabled(entity_id, "ParticleEmitterComponent")
local sprite_emitter = EntityGetFirstComponentIncludingDisabled(entity_id, "SpriteParticleEmitterComponent")
local lua = EntityGetFirstComponentIncludingDisabled(entity_id, "LuaComponent")
local times_run = ComponentGetValue2(lua, "mTimesExecuted")

if times_run >= 18 then
    ComponentSetValue2(particle_emitter, "is_emitting", true)
    ComponentSetValue2(sprite_emitter, "is_emitting", true)
end

EntitySetTransform(entity_id, x, y - 1)
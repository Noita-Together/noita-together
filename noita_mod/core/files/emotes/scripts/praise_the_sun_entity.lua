local entity_id = GetUpdatedEntityID()
local lights = EntityGetComponentIncludingDisabled(entity_id, "LightComponent")
local sprite = EntityGetFirstComponentIncludingDisabled(entity_id, "SpriteComponent")
local particles = EntityGetFirstComponentIncludingDisabled(entity_id, "ParticleEmitterComponent")
local lua = EntityGetFirstComponentIncludingDisabled(entity_id, "LuaComponent")
local times_run = ComponentGetValue2(lua, "mTimesExecuted")

if times_run == 0 then
    local x, y = EntityGetTransform(entity_id)
    EntitySetTransform(entity_id, x, y - 20)
end

if times_run > 53 then
    ComponentSetValue(lights[1], "radius", times_run * 0.3)
    ComponentSetValue(lights[2], "radius", times_run * 0.1)
    ComponentSetValue(lights[3], "radius", times_run * 0.1)
end

if times_run == 153 then
    ComponentSetValue2(particles, "is_emitting", true)
end

if times_run > 153 then
    ComponentSetValue(lights[4], "radius", (times_run - 150) * 0.1)
    ComponentSetValue(lights[5], "radius", (times_run - 150) * 0.1)
    ComponentSetValue2(sprite, "alpha", math.min(0.1, (times_run - 153) * 0.003))
end

if times_run == 153 then
    ComponentSetValue2(particles, "emission_interval_min_frames", 13)
    ComponentSetValue2(particles, "emission_interval_max_frames", 13)
end

if times_run == 163 then
    ComponentSetValue2(particles, "emission_interval_min_frames", 11)
    ComponentSetValue2(particles, "emission_interval_max_frames", 11)
end

if times_run == 173 then
    ComponentSetValue2(particles, "emission_interval_min_frames", 9)
    ComponentSetValue2(particles, "emission_interval_max_frames", 9)
end

if times_run == 183 then
    ComponentSetValue2(particles, "emission_interval_min_frames", 7)
    ComponentSetValue2(particles, "emission_interval_max_frames", 7)
end

if times_run == 193 then
    ComponentSetValue2(particles, "emission_interval_min_frames", 5)
    ComponentSetValue2(particles, "emission_interval_max_frames", 5)
end

if times_run > 325 then
    ComponentSetValue2(sprite, "alpha", math.max(0.0, 0.1 - (times_run - 325) * 0.01))
    ComponentSetValue2(particles, "is_emitting", false)
end

--[[if times_run > 68 and times_run < 83 then
    --GamePrint(tostring(times_run))
    ComponentSetValue2(particle_emitter, "is_emitting", true)
    ComponentSetValue2(sprite_emitter, "is_emitting", true)
end

if times_run >= 83 then
    ComponentSetValue2(particle_emitter, "is_emitting", false)
    ComponentSetValue2(sprite_emitter, "is_emitting", false)
end]]
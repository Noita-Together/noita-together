local entity_id = GetUpdatedEntityID()
local lua_component = EntityGetFirstComponent(entity_id, "LuaComponent")
local particle_emitter_component = EntityGetFirstComponent(entity_id, "ParticleEmitterComponent")
--local variable_storage_component = EntityGetFirstComponent(entity_id, "VariableStorageComponent")

if particle_emitter_component then
    --oneshot fix attractor_force then disable script for now
    local force = ComponentGetValue2(particle_emitter_component, "attractor_force")
    if force > 0 then
        ComponentSetValue2(particle_emitter_component, "attractor_force", -0.4)
        EntitySetComponentIsEnabled(entity_id, lua_component, false)
        return
    end
end

local r_min, _ = ComponentGetValue2(particle_emitter_component, "area_circle_radius")

--this assumes 190 is the starting value...
if r_min == 190 then
    ComponentSetValue2(particle_emitter_component, "emitted_material_name", "fire_blue")
    ComponentSetValue2(particle_emitter_component, "lifetime_max", 5.0)
end

--shrink radius over time until zero, increasing particle speed as well
if r_min > 0 then
    r_min = r_min - 6
    local velo = ComponentGetValue2(particle_emitter_component, "velocity_always_away_from_center")
    velo = velo * 1.1
    ComponentSetValue2(particle_emitter_component, "velocity_always_away_from_center", velo)
    ComponentSetValue2(particle_emitter_component, "area_circle_radius", r_min, r_min+10)
else
    --activate the real sampo now?
    local disabled_sampo = EntityGetWithTag("disabled_sampo")[1]
    local x,y = EntityGetTransform(disabled_sampo or entity_id) --fall back to us in case disabled_sampo is gone? shouldnt happen though
    EntityLoad( "data/entities/animals/boss_centipede/sampo.xml", x, y)
    EntityKill(disabled_sampo)

    --it is done
    EntityKill(entity_id)
end
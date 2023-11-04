local entity_id = GetUpdatedEntityID()
local particle_emitter_component = EntityGetComponentIncludingDisabled(entity_id, "ParticleEmitterComponent")

--sneaky hack to fix attractor after mod restart :^)
local m_particle_attractor_id = ComponentGetValue2(particle_emitter_component[1], "m_particle_attractor_id")
--print_error("m_particle_attractor_id = " .. m_particle_attractor_id)
if m_particle_attractor_id < 0 then
    m_particle_attractor_id = ComponentGetValue2(particle_emitter_component[2], "m_particle_attractor_id")
    --print_error("new m_particle_attractor_id = " .. m_particle_attractor_id)
    ComponentSetValue2(particle_emitter_component[1], "m_particle_attractor_id", m_particle_attractor_id)
end
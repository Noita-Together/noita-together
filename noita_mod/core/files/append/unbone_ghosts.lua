local actual_old_SpawnApparition = SpawnApparition

SpawnApparition = function(x, y, level, spawn_now)
    spawn_now = spawn_now or false
    local state, apparition = actual_old_SpawnApparition(x, y, level, spawn_now)
    if (GameHasFlagRun("NT_unbone_ghosts") and apparition ~= nil) then
        EntityKill(apparition)
        return state, EntityLoad("data/entities/animals/playerghost.xml", x, y)
    else
        return state, apparition
    end
end

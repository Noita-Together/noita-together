local _drop_random_reward = drop_random_reward
function drop_random_reward( x, y, entity_id, rand_x, rand_y, set_rnd_ )
    local _SetRandomSeed = SetRandomSeed
    SetRandomSeed = function(x,y)
        local offset = GameHasFlagRun("NT_world_randomize_loot") and ModSettingGet("noita-together.NT_RNGLOOT_SEED") or 0
        _SetRandomSeed(x + offset, y + offset)
        --nt print_error("gun_procedural " .. x .. "," .. y)
    end
    local ret = _drop_random_reward( x, y, entity_id, rand_x, rand_y, set_rnd_ )
    SetRandomSeed = _SetRandomSeed
    return ret
end

--zap this function, its only used to spawn the sampo from GTC
local _EntityLoadEndGameItem = EntityLoadEndGameItem
function EntityLoadEndGameItem(e,x,y)
    --replace GTC sampo with something spicy :)
    if e == "data/entities/animals/boss_centipede/sampo.xml" then
        EntityLoad("data/entities/animals/longleg.xml",x,y) --hamis
    else
        _EntityLoadEndGameItem(e,x,y)
    end
end

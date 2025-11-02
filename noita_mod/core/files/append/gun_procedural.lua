local _generate_gun = generate_gun;
function generate_gun( cost, level, force_unshuffle )
    local _SetRandomSeed = SetRandomSeed
    SetRandomSeed = function(x,y)
        local offset = GameHasFlagRun("NT_world_randomize_loot") and ModSettingGet("noita-together.NT_RNGLOOT_SEED") or 0
        _SetRandomSeed(x + offset, y + offset)
        --nt print_error("gun_procedural " .. x .. "," .. y)
    end
    _generate_gun(cost, level, force_unshuffle)
    SetRandomSeed = _SetRandomSeed
end

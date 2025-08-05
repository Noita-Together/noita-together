local _generate_shop_item = generate_shop_item
function generate_shop_item( x, y, cheap_item, biomeid_, is_stealable )
    local _SetRandomSeed = SetRandomSeed
    SetRandomSeed = function(x,y)
        local offset = GameHasFlagRun("NT_world_randomize_loot") and ModSettingGet("noita-together.NT_RNGLOOT_SEED") or 0
        _SetRandomSeed(x + offset, y + offset)
        --nt print_error("generate_shop_item " .. x .. "," .. y)
    end
    _generate_shop_item(x, y, cheap_item, biomeid_, is_stealable );
    SetRandomSeed = _SetRandomSeed
end

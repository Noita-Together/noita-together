-- this file modifes the original effect scripts in data/scripts/status_effect/hearty_start.lua, data/scripts/status_effect/hearty_end.lua, data/entities/misc/effect_hearty.xml
-- the modification basically disables the "heart mage trick" by letting the effect temporarily halves the current hp instead of max hp when running under "Respawn Penalty"
-- this script is called once in init.lua with  dofile_once("mods/noita-together/files/scripts/heart_mage_trick_fix.lua")


-- In data/scripts/status_effects/hearty_start.lua
-- original: max_hp = max_hp * 0.5
-- original: hp = math.max( max_hp * diff, 0.04 )
-- replaced: hp = math.max( hp * 0.5, 0.04 )

script = ModTextFileGetContent("data/scripts/status_effects/hearty_start.lua")
script = script:gsub("max_hp = max_hp %* 0%.5", "if (not (GameHasFlagRun(\"death_penalty_weak_respawn\"))) then max_hp = max_hp * 0.5")
script = script:gsub("hp = math.max%( max_hp %* diff, 0%.04 %)", "hp = math.max( max_hp * diff, 0.04 ) else hp = math.max( hp * 0.5, 0.04 ) end")
ModTextFileSetContent("data/scripts/status_effects/hearty_start.lua", script)



-- In data/scripts/status_effects/hearty_end.lua
-- original: max_hp = max_hp * 2.0
-- original: hp = max_hp * diff
-- replaced: hp = math.min(math.max(hp * 2.0, 0.04), max_hp)

script = ModTextFileGetContent("data/scripts/status_effects/hearty_end.lua")
script = script:gsub("max_hp = max_hp %* 2%.0", "if (not (GameHasFlagRun(\"death_penalty_weak_respawn\"))) then max_hp = max_hp * 2.0")
script = script:gsub("hp = max_hp %* diff", "hp = max_hp * diff else hp = math.min(math.max(hp * 2.0, 0.04), max_hp) end")
ModTextFileSetContent("data/scripts/status_effects/hearty_end.lua", script)



-- In data/entities/misc/effect_hearty.xml
-- original: description="$statusdesc_hearty"
-- replaced: description="[NT Fix] Your health is temporarily halved."

script = ModTextFileGetContent("data/entities/misc/effect_hearty.xml")
script = script:gsub("description=\"$statusdesc_hearty\"", "description=\"[NT Fix] Your health is temporarily halved.\"")
ModTextFileSetContent("data/entities/misc/effect_hearty.xml", script)
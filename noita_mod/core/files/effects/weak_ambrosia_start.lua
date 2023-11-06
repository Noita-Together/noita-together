dofile_once("data/scripts/lib/utilities.lua")

local entity_id = GetUpdatedEntityID()
local player_id = EntityGetParent( entity_id )
local x, y = EntityGetTransform( entity_id )

if ( player_id ~= NULL_ENTITY ) and ( entity_id ~= player_id ) then
	local comp = EntityGetFirstComponent( player_id, "DamageModelComponent" )
	
	--add physics_hit and curse resists; cannot add holy yet (doesnt exist in DamageModelComponent???)
	--some weird esoteric damage types cant be handled this way https://noita.wiki.gg/wiki/Damage_Types#Esoteric_Damage_Types
	--order them in the same way the game does
	local resist_names = { "melee", "projectile", "explosion", "electricity", "fire", "drill", "slice", "ice", "physics_hit", "radioactive", "poison", "overeating", "curse"}
	
	for _,res in ipairs(resist_names) do
		local value = ComponentObjectGetValue2(comp, "damage_multipliers", res)
		if value then
			value = value * 0.5
			ComponentObjectSetValue2(comp, "damage_multipliers", res, value)
		end
	end
end
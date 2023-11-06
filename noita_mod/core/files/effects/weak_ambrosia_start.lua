dofile_once("data/scripts/lib/utilities.lua")

local entity_id = GetUpdatedEntityID()
local player_id = EntityGetParent( entity_id )
local x, y = EntityGetTransform( entity_id )

if ( player_id ~= NULL_ENTITY ) and ( entity_id ~= player_id ) then
	local comp = EntityGetFirstComponent( player_id, "DamageModelComponent" )
	--local comps = EntityGetComponent( entity_id, "VariableStorageComponent" )
	
	--add physics_hit and curse resists; cannot add holy yet (doesnt exist in DamageModelComponent???)
	--some weird esoteric damage types cant be handled this way https://noita.wiki.gg/wiki/Damage_Types#Esoteric_Damage_Types
	--order them in the same way the game does
	local resist_names = { "melee", "projectile", "explosion", "electricity", "fire", "drill", "slice", "ice", "physics_hit", "radioactive", "poison", "overeating", "curse"}
	--local result = ""
	
	for _,res in ipairs(resist_names) do
		local value = ComponentObjectGetValue2(comp, "damage_multipliers", res)
		if value then
			value = value * 0.5
			ComponentObjectSetValue2(comp, "damage_multipliers", value)
		end
	end

	--[[if ( comp ~= nil ) and ( comps ~= nil ) then
		for a,b in ipairs( resists ) do
			local r = tostring(ComponentObjectGetValue( comp, "damage_multipliers", b ))
			
			result = result .. r
			
			if ( a < #resists ) then
				result = result .. " "
			end
			
			ComponentObjectSetValue( comp, "damage_multipliers", b, "0.5" )
		end
	
		if ( #result > 0 ) then
			for i,v in ipairs( comps ) do
				local n = ComponentGetValue2( v, "name" )
				
				if ( n == "resis_data" ) then
					ComponentSetValue2( v, "value_string", result )
					break
				end
			end
		end
	end]]--
end
dofile_once("data/scripts/lib/utilities.lua")

local entity_id = GetUpdatedEntityID()
local player_id = EntityGetParent(entity_id)
local x, y = EntityGetTransform(entity_id)

if (player_id ~= NULL_ENTITY) and (entity_id ~= player_id) then
	local variablestorages = EntityGetComponent(entity_id, "VariableStorageComponent")
	local uiiconstorages = EntityGetComponent(entity_id, "UIIconComponent")
	local dcomps = EntityGetComponent(player_id, "DamageModelComponent")
	local hpdiff = 0.0
	local stop = false

	if (dcomps ~= nil) then
		for j, comp in ipairs(dcomps) do
			local hp = ComponentGetValue2(comp, "hp")
			local max_hp = ComponentGetValue2(comp, "max_hp")

			if (max_hp <= 0.4) or (EntityHasTag(player_id, "boss_centipede") and (GameGetOrbCountThisRun() >= 33)) then
				stop = true
			end

			if (stop == false) then
				if (GameHasFlagRun("NT_alt_heartache")) then
					hpdiff = hp
					hp = math.max(hp * 0.5, 0.04)
				else
					local diff = hp / max_hp
					hpdiff = max_hp
					max_hp = max_hp * 0.5
					hp = math.max(max_hp * diff, 0.04)
				end
				ComponentSetValue2(comp, "max_hp", max_hp)
				ComponentSetValue2(comp, "hp", hp)
			end
		end
	end

	if (variablestorages ~= nil) then
		for j, storage_id in ipairs(variablestorages) do
			local var_name = ComponentGetValue(storage_id, "name")
			if (var_name == "effect_hearty") then
				if (stop == false) then
					ComponentSetValue2(storage_id, "value_float", hpdiff)
					-- Make use of the unused boolean store for heartache to ensure effect has consistent behavior when it expires in heart_end.lua
					ComponentSetValue2(storage_id, "value_bool", GameHasFlagRun("NT_alt_heartache"))
				else
					EntityRemoveComponent(entity_id, storage_id)
				end
				break
			end
		end
	end

	-- Change the tooltip icon for alternate heartache
	if (GameHasFlagRun("NT_alt_heartache")) then
		if (uiiconstorages ~= nil) then
			for j, storage_id in ipairs(uiiconstorages) do
				local icon_name = ComponentGetValue(storage_id, "name")
				if (icon_name == "$status_hearty") then
					ComponentSetValue2(storage_id, "description", "$noitatogether_statusdesc_alt_hearty")
					break
				end
			end
		end
	end
end

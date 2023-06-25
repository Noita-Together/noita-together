local entity_id = GetUpdatedEntityID()

--update localization!
local labels = EntityGetComponentIncludingDisabled(entity_id, "SpriteComponent")
if (labels ~= nil) then
    for i,label_id in ipairs(labels) do
        local labelText = ComponentGetValue2(label_id, "text")
        if (string.sub(labelText, 1, 1) == "$") then --only if it starts with $
            ComponentSetValue2(label_id, "text", GameTextGet(labelText))
        end
    end
end    
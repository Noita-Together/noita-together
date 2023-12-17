--NOTE: The standalone version of noita-emotes uses these functions
--to play nice with more than one multiplayer framework. I've streamlined
--them for this integration to only handle NT. -infinitesunrise

dofile("mods/noita-together/files/store.lua")
dofile("mods/noita-together/files/scripts/json.lua")

--tell multiplayer frameworks that we're starting an emote, so other players get informed as well
function send_emote(emote_name)
    local payload = { 
        event = "CustomModEvent",
        payload = {
            name = "Emote",
            emote = emote_name
        }
    }
    local queue = json.decode(NT.wsQueue)
    table.insert(queue, payload)
    NT.wsQueue = json.encode(queue)
end

--tell multiplayer frameworks that we're starting an emote, so other players get informed as well
function send_skin_swap(skin_name)
    local payload = { 
        event = "CustomModEvent",
        payload = {
            name = "Skin",
            skin = skin_name
        }
    }
    local queue = json.decode(NT.wsQueue)
    table.insert(queue, payload)
    NT.wsQueue = json.encode(queue)
end
if NT then
    return
end
dofile("mods/noita-together/files/stringstore/stringstore.lua")
dofile("mods/noita-together/files/stringstore/noitaglobalstore.lua")
NT = stringstore.open_store(stringstore.noita.global("NT_STORE"))

if (NT.initialized ~= true) then
    NT.run_started = false
    NT.player_count = 1
    NT.players = {}
    NT.current_location = "Mountain"

    NT.sampo_orbs = 0
    NT.players_won = 0 -- Players that have killed the boss
    NT.run_ended = false
    NT.sent_steve = false
    NT.end_msg = ""

    NT.skip_heart = 0

    NT.initialized = true
    NT.wsQueue = "[]"
    NT.queuedItems = "[]"
    NT.gold_queue = 0

    --"Health Check" values for making sure we're running OK
    NT.HealthCheck = {AsyncLoopLastFrame=-1} --accessing table members when global store is not ready breaks random scripts...
    --NT.HealthCheck.AsyncLoopLastFrame = -1 --aka dont do this, do the above
end
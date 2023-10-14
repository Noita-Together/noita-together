# Noita Together Core

- Translation support (mod developers please append to noita-together/files/translations/translations.csv)
- All Noita Together flags have been changed to include `NT_` before the flag name 
- Add NT_is_host run flag when you are the lobby host
- Bank improvements
    - Double page function will go UP TO 10 pages forward or back now
    - Right click on spell filters to select it and deselect all others
    - First-pass spells charge display in bank
    - Fix banked wands with always casts gaining slots
- Refactor hourglass events 
  - Refactored the SecretHourglass events into its own file, An example mod that implements its own effects can be found at [https://github.com/tehkab/noita-together-hourglass-events-example](https://github.com/tehkab/noita-together-hourglass-events-example)
- Users can no longer poly themselves before the run starts 
- Fix issues where the NT thread does not always start
  - Move ws.lua dofile to OnWorldInitialized, helps consistency 
- optimize cPlayerMove distance check 
- Add a mod option to set player opacity - Thanks salticibread!
- Lock controls while hovering bank, message textboxes
- Renamed some UI text relating to messages
- Show proper sampo name when picked up by other players
- Update protobuf files :)
- Alternate message when other player picks up sampo when we already have ours
- Update extra max HP and better max HP pickups to no longer cause infinite health on client sync issues (does not fix the bug, but logs when it breaks, and gives the user the min HP from the heart)
- Better extra max HP gives more health at its minimum point
- Extra max HP minimum health given now scales with stronger hearts
- Add option to disable perk/spell/enemy progress in NT mod settings
- Fix issues where player ghost cosmetics and other functionality broke after hiding ghosts and showing again. See [noita-together/pull/86](https://github.com/Noita-Together/noita-together/pull/86) for implementation details (mods will want to use the new functions) 
- Fix broken ui when inspecting other players wands (regression from showing spell charges in related UI)
- Fix potion/bag issues when withdrawing from bank preventing new beta features, and other stuff [noita-together/pull/88](https://github.com/Noita-Together/noita-together/pull/88) for more details
- Raise secret hourglass acceleratium time to 2 min [noita-together/pull/91](https://github.com/Noita-Together/noita-together/pull/91) 

# Noita Together Nemesis

Please note that most fixes above in Noita Together Core have not been ported to Nemesis

- fix for nemesis "ban invisibility" perk

# Noita Together App

- Better game path detection and actually save the chosen game path
- Add an option to sort the room user list
- Add a mod tab to view mods per user in a different way 
- Add an /endrun command for hosts to force the run to generate stats 
- User died message has changed
- Update protobuf files :)
- Set a default room name for uaccess people
- Fix chat not autoscrolling down in some cases
- Limit the chat messages to 2000 characters- 

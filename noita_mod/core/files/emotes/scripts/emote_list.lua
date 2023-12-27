emote_list = {
    wave = {
        gui_name = "Wave", --tooltip text in emote menu
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/wave.png", --icon in emote menu
        frames = 0, --how many game frames (not animation frames!) the emote lasts, if < 1 then will loop until player ends the emote. [frame_wait (from RectAnimation) * number of frames * 60 (fps), then round up]
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml", --custom player body animation goes here
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",  --custom crown cosmetic animation goes here
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml", --custom amulet cosmetic animation goes here
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml", --custom amulet gem animation goes here
        lukki_animation_file = nil, --custom lukki body animation goes here (not yet implemented)
        custom_cape_hotspot = true, --set this to true if the player sprite xml includes a cape hotspot file (defined in the player_animation_file)
        spawn_entity = nil --spawn an entity from an xml file at player position at beginning of emote, gets killed when emote ends if not already gone
    },
    heart = {
        gui_name = "Heart",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/heart.png",
        frames = 101,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file ="mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = true,
        spawn_entity = "mods/noita-together/files/emotes/entities/heart_entity.xml"
    },
    thumbs_up = {
        gui_name = "Thumbs Up",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/thumbs_up.png",
        frames = 240,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = true,
        spawn_entity = "mods/noita-together/files/emotes/entities/thumbs_up_entity.xml"
    },
    disapprove = {
        gui_name = "Dissaprove",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/disapprove.png",
        frames = 140,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = true,
        spawn_entity = nil
    },
    come_on = {
        gui_name = "Beckon",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/beckon.png",
        frames = 0,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = true,
        spawn_entity = nil
    },
    t_pose = {
        gui_name = "T-Pose",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/t_pose.png",
        frames = 0,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = true,
        spawn_entity = nil
    },
    mario = {
        gui_name = "Mario Dance",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/mario.png",
        frames = 0,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = true,
        spawn_entity = nil
    },
    luigi = {
        gui_name = "Luigi Dance",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/luigi.png",
        frames = 0,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = true,
        spawn_entity = nil
    },
    clap = {
        gui_name = "Clap",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/clap.png",
        frames = 0,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = true,
        spawn_entity = nil
    },
    macarena = {
        gui_name = "Macarena",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/macarena.png",
        frames = 0,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = true,
        spawn_entity = nil
    },
    the_wave = {
        gui_name = "The Wave",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/thewave.png",
        frames = 0,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = true,
        spawn_entity = nil
    },
    aggressive_point = {
        gui_name = "Aggressive Point",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/aggressive_point.png",
        frames = 0,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = true,
        spawn_entity = "mods/noita-together/files/emotes/entities/aggressive_point_entity.xml"
    },
    default_dance = {
        gui_name = "Default Dance",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/default_dance.png",
        frames = 0,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = false,
        spawn_entity = nil
    },
    praise_the_sun = {
        gui_name = "Praise The Sun",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/praise_the_sun.png",
        frames = 375,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = true,
        spawn_entity = "mods/noita-together/files/emotes/entities/praise_the_sun_entity.xml"
    },
    dab = {
        gui_name = "Dab",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/dab.png",
        frames = 0,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = true,
        spawn_entity = nil
    },
    worm = {
        gui_name = "Worm",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/worm.png",
        frames = 216,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = true,
        spawn_entity = nil
    },
    meditate = {
        gui_name = "Meditate",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/meditate.png",
        frames = 0,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = true,
        spawn_entity = nil
    },
    repose = {
        gui_name = "Repose",
        gui_icon = "mods/noita-together/files/emotes/ui_gfx/icons/repose.png",
        frames = 0,
        player_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player.xml",
        crown_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_hat2.xml",
        amulet_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet.xml",
        gem_animation_file = "mods/noita-together/files/emotes/entities_gfx/emotes_gfx_player_amulet_gem.xml",
        lukki_animation_file = nil,
        custom_cape_hotspot = true,
        spawn_entity = nil
    }
}
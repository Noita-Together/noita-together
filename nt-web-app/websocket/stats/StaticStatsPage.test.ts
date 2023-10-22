// ts-node .\StaticStatsPage.test.ts
//file output: nt-web-app/.storage/stats/deadbeef/eadg-beaf/stats-final.html

import {StaticStatsPageGenerator} from "./StaticStatsPageGenerator";

const userData = {
    'doggo': {
        name: 'Doge',
        id: 'doggo',
        hearts: 10,
        orbs: 3,
        deaths: 1,
        steve: true,
        left: false
    },
    'cat': {
        name: 'Whiskers',
        id: 'cat',
        hearts: 3,
        orbs: 2,
        deaths: 2,
        steve: false,
        left: true
    },
    'elephant': {
        name: 'Dumbo',
        id: 'elephant',
        hearts: 5,
        orbs: 10,
        deaths: 0,
        steve: true,
        left: true
    },
    'frog': {
        name: 'Kermit',
        id: 'frog',
        hearts: 2,
        orbs: 4,
        deaths: 1,
        steve: false,
        left: false
    },
    'giraffe': {
        name: 'Longneck',
        id: 'giraffe',
        hearts: 4,
        orbs: 0,
        deaths: 2,
        steve: true,
        left: true
    },
    'kangaroo': {
        name: 'Joey',
        id: 'kangaroo',
        hearts: 3,
        orbs: 1,
        deaths: 0,
        steve: false,
        left: false
    },
    'penguin': {
        name: 'Chilly',
        id: 'penguin',
        hearts: 2,
        orbs: 3,
        deaths: 1,
        steve: true,
        left: true
    },
    'lion': {
        name: 'Simba',
        id: 'lion',
        hearts: 4,
        orbs: 2,
        deaths: 3,
        steve: true,
        left: false
    },
    'turtle': {
        name: 'Shelly',
        id: 'turtle',
        hearts: 11,
        orbs: 0,
        deaths: 0,
        steve: false,
        left: true
    },
    'panda': {
        name: 'Bamboo',
        id: 'panda',
        hearts: 3,
        orbs: 4,
        deaths: 2,
        steve: true,
        left: false
    },
    'monkey': {
        name: 'Banana',
        id: 'monkey',
        hearts: 2,
        orbs: 11,
        deaths: 1,
        steve: false,
        left: true
    },
    'zebra': {
        name: 'Stripes',
        id: 'zebra',
        hearts: 4,
        orbs: 3,
        deaths: 2,
        steve: true,
        left: false
    },
    'rhino': {
        name: 'Hornsy',
        id: 'rhino',
        hearts: 1,
        orbs: 2,
        deaths: 0,
        steve: false,
        left: true
    },
    'octopus': {
        name: 'Inky',
        id: 'octopus',
        hearts: 13,
        orbs: 3,
        deaths: 1,
        steve: true,
        left: false
    },
    'whale': {
        name: 'Moby',
        id: 'whale',
        hearts: 5,
        orbs: 4,
        deaths: 3,
        steve: true,
        left: true
    },
    'dolphin': {
        name: 'Flipper',
        id: 'dolphin',
        hearts: 12,
        orbs: 1,
        deaths: 2,
        steve: false,
        left: false
    },
    'parrot': {
        name: 'Polly',
        id: 'parrot',
        hearts: 4,
        orbs: 0,
        deaths: 1,
        steve: true,
        left: true
    },
    'bear': {
        name: 'Grizzly',
        id: 'bear',
        hearts: 1,
        orbs: 3,
        deaths: 0,
        steve: false,
        left: false
    },
    'shark': {
        name: 'Jaws',
        id: 'shark',
        hearts: 3,
        orbs: 2,
        deaths: 12,
        steve: true,
        left: true
    },
    'deer': {
        name: 'Bambi',
        id: 'deer',
        hearts: 2,
        orbs: 4,
        deaths: 23,
        steve: false,
        left: false
    }
};

// You can use the 'data' object for testing and sorting purposes.

const stats = {
    roomName: "Test room name",
    users: userData, // id: {name: string, id: string, orbs: number, hearts: number, deaths: number, deposits: {}, withdraws: {}, steve: bool, left: bool}
    deposits: {
        spells: {},
        wands: {},
        items: {}
    }
}
StaticStatsPageGenerator.GenerateHtmlStats('deadbeef', 'eadg-beaf', stats)
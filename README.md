
# Noita Together
Play alone together
[click here to downloads](https://github.com/Noita-Together/noita-together/releases)

## What is Noita Together?
Noita Together is an attempt to bring a slight multiplayer aspect to the game, think of it more like everyone is in different dimensions yet you can still see other players and somewhat interact with each other you can not directly affect other player's worlds

it consists of an app made with electron for the twitch authentication and making/joining rooms and some other things and a lua mod that communicates with the app in-game 
mod uses [pollws](https://github.com/probable-basilisk/pollws/) made by probable-basilisk (fakepyry / pyry)

### **How to install [(click here)](https://github.com/Noita-Together/noita-together/wiki/Installation)**
### **How to use [(click here)](https://github.com/Noita-Together/noita-together/wiki/Usage)**
### **FAQ [(click here)](https://github.com/Noita-Together/noita-together/wiki/FAQ)**

## Contributing

### Electron application

Get setup by running the following:

- This assumes you have NodeJS installed (Max version for now due to ssl issues: 16.20.0) (Note, later when we update libraries we want to change this)
- This assumes you have Yarn installed https://yarnpkg.com/getting-started/install

```
yarn install
yarn client
```

#### Configuring your environment

We do NOT version the .env file, so we need to create one :)

Create a .env file at `nt-app/`
```env
VUE_APP_HOSTNAME=http://localhost:3000/api
VUE_APP_NT_LOGIN_URL=http://localhost:3000/api/auth/login
VUE_APP_LOBBY_SERVER_WS_URL_BASE=ws://localhost:4444/ws
```

TODO github actions setup


### Backend 

#### First time setup

```
yarn install
yarn serverInitOnce
```

#### Running the server

```
yarn install
yarn serverDev
```

Using dockerfile to test pm2:
```
docker build .
```
Then you want to start the container, binding port 3000
https://docs.docker.com/engine/reference/commandline/run/

#### ~~Updating the protobuf file~~ (Outdated)

Please only make changes at `https://github.com/Noita-Together/lobby-server/blob/main/proto/messages.proto`

Then after changes are complete, run `???` //TODO

#### Configuring your environment

We do NOT version the .env file, so we need to create one :)

Create a .env file at `nt-app/`
```env
TWITCH_API_KEY=
TWITCH_CLIENT_ID=
OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/login
WEBSERVER_AUTH_URL=http://localhost:3000
NOITA_APP_REDIRECT_URI=http://localhost:25669
NEXT_PUBLIC_LOBBY_SERVER_API_URL_BASE=https://localhost:4444/api
```

TODO github actions setup

### Noita Mods

Building new mods

run the following:

```
yarn install
node ./build-mods.js
```

Commit the following files afterwards:

```
noita_mod/core/manifest.json
noita_mod/nemesis/manifest.json
```

#### Core mod

Location: noita_mod/core

#### Nemesis

Location: noita_mod/nemesis


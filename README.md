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

### Running locally for development

Noita Together consists of a number of cooperating pieces, which currently live in various repositories:

- The mod itself [this repository](/noita_mod)
- The companion app [this repository](/nt-app)
- The website / auth server [this repository](/nt-web-app)
- The lobby server [lobby-server repository](https://github.com/Noita-Together/lobby-server)
- The protobuf library [nt-message repository](https://github.com/Noita-Together/nt-message)

In addition, the auth server requires a [Twitch app](https://dev.twitch.tv/console) and a database, currently postgres. The components can be run directly, but you will benefit from having [Docker](https://docs.docker.com/get-docker/) available.

#### Gather requirements

- Create a Twitch app to use for logging in. Note down the Client ID and the Client Secret. For redirect URI, use `http://localhost:3000/api/auth/code`. If you have a domain you'd like to use, add that too. Non-localhost redirect URIs must be `https`.
- Create two random passwords to be used for the JWT secrets (dubbed access and refresh). Note them as well.
- Set up a postgres database. You can use [the official Docker postgres image](https://hub.docker.com/_/postgres) to launch a server easily. Note down the connection information (host, port, username, password, database name)
- Install [nvm](https://github.com/nvm-sh/nvm) to more easily switch Node versions
- Clone this repository. If you intend to make changes, fork this repository and clone your fork instead. Install dependencies (`nvm install 16.20.0; nvm use 16.20.0; yarn`)
- Clone the [lobby-server repository](https://github.com/Noita-Together/lobby-server). If you intend to make changes, fork that repository and clone your fork instead. Install dependencies (`nvm install 21; nvm use 21; npm install`)
- Note that this repository uses `yarn` (`npm install -g yarn`), while the other repositories use `npm`.
- If you intend to make changes to the protobuf messages, you'll also need to fork and clone the [nt-message](https://github.com/Noita-Together/nt-message) repository. You can use npm link / yarn link so that the dependent projects receive your changes (don't forget to build!)

#### Configure the auth server

Create the file `noita-together/nt-web-app/.env` with the following contents. (Note: Lines beginning with `#` are comments and can be removed.)

```sh
# The auth server will sign your username and userid after successful Twitch OAuth
# with these keys. The lobby server will authenticate you by the JWT, so these values
# must match the lobby-server's values.
SECRET_JWT_ACCESS=<one of the passwords you generated above>
SECRET_JWT_REFRESH=<the other password you generated above>

# The auth server needs these to successfully complete the OAuth handshake with Twitch
TWITCH_CLIENT_ID=<the Client ID of the twitch app you made above>
TWITCH_API_KEY=<the API Key of the twitch app you made above>

# Despite the name, this is the _origin_ of your redirect URI. Do not include /api/auth/login
OAUTH_REDIRECT_URI=http://localhost:3000
# Include the full path of the redirect URI
WEBSERVER_AUTH_URL=http://localhost:3000/api/auth/login

# Hardcoded in the companion app, use as-is
NOITA_APP_REDIRECT_URI=http://localhost:25669

# This URL will depend on how you run and configure the lobby server (below)
# use https if you launch the lobby server with a certificate, http if you don't.
# use port 4444 if you run the lobby server directly (ts-node or similar), use
# port 4433 if you use docker and the default blue/green settings and run the
# "blue" configuration. This only affects the "Server Status" check in the
# auth server's landing page.
NEXT_PUBLIC_LOBBY_SERVER_API_URL_BASE=http://localhost:4444/api

DEV_MODE=false

# Database credentials
DATABASE_HOST=<your postgres host>
DATABASE_PORT=<your postgres port>
DATABASE_NAME=<your postgres database name>
DATABASE_USERNAME=<your postgres username>
DATABASE_SECRET=<your postgres password>
```

If your database requires SSL, supply the certificate to connect with in the environment variable `DATABASE_CA_CERT`. This is the contents of the certificate, not the path to it.

To set up the database (one time only), run `yarn workspace nt-web-app init-db`.
To launch the server locally in dev mode, run `yarn workspace nt-web-app dev`.

#### Configure the lobby server

NOTE: Unlike the noita-together repository code, the lobby server does not use the `dotenv` node module for configuration, preferring instead to leave the environment to the shell. Windows users will probably have a bad time unless they use WSL or Cygwin. PRs welcome for supporting batch files or Powershell scripts. If nothing else, you can just run `set ENV_VAR=value` in a command prompt before running things manually.

In your clone of the `noita-together/lobby-server` repository:

Create the file `lobby-server/deploy/.env` with the following contents. (Note: Lines beginning with `#` are comments and can be removed.)

Most values can be left empty (`KEY=`) for the defaults, but secrets and URLs are required.

```sh
# Docker build/run configuration
CONTAINER_NAME=lobby-server
IMAGE_NAME=lobby-server

# The auth server will sign your username and userid after successful Twitch OAuth
# with these keys. The lobby server will authenticate you by the JWT, so these values
# must match the lobby-server's values.
JWT_SECRET=<same as SECRET_JWT_ACCESS in nt-web-app>
JWT_REFRESH=<same as SECRET_JWT_REFRESH in nt-web-app>

# Leave empty unless you want the lobby server to listen on a TLS websocket.
# If a value is set here, you should either have a Let's Encrypt certificate
# by the same name at /etc/letsencrypt/{live,archive}/TLS_SERVER_NAME, _or_
# have a `privkey.pem` and `fullchain.pem` in `lobby-server/deploy/tls`
TLS_SERVER_NAME=

# Leave empty unless you want the lobby server to listen on a UNIX domain socket.
# If a value is set here, it should be a path to the desired socket file. You will
# need to ensure the file does not exist before running the server.
APP_UNIX_SOCKET=
# The listen address to bind. Default `0.0.0.0`.
APP_LISTEN_ADDRESS=
# The listen port to bind. Default `4444`.
APP_LISTEN_PORT=

# These must line up with the companion app. Set to these values.
WS_PATH='/ws'
API_PATH='/api'

# When true, only privileged users can create rooms. Default `false`.
DEV_MODE=

# Used for CORS. Set to the origin of the auth server (the URL without any path)
WEBFACE_ORIGIN=http://localhost:3000

## Server graceful shutdown configuration

# The server will exit after the drop dead timeout if users haven't already left.
# Default 1 hour.
DRAIN_DROP_DEAD_TIMEOUT_S=
# Inactive rooms will be destroyed after the grace timeout. Default 5 minutes.
DRAIN_GRACE_TIMEOUT_S=
# The server will notify active rooms of a pending shutdown at this interval.
# Default 1 minute.
DRAIN_NOTIFY_INTERVAL_S=

## uWS configuration

# uWS will close websockets that are unresponsive and inactive after this duration.
# Pings are sent to keep connections alive, but proxies may also drop connections,
# so this value should be set lower than any proxy timeout to ensure pings are sent
# in time.
UWS_IDLE_TIMEOUT_S=

# uWS will close a websocket immediately if it sends a message larger than this
# size. This is fatal to a game if the host is the one that is disconnected.
# Default 16 MiB - the fridge size can get big in large runs
UWS_MAX_PAYLOAD_LENGTH_BYTES=

# Log a warning message when receiving large payloads. Default 80% of max payload
WARN_PAYLOAD_LENGTH_BYTES=
```

To launch the server locally in dev mode, run `./deploy/dev.sh`

##### Docker blue/green env config:

Create a Docker network named `nt`: `docker network create nt`

Create the following directories and files:

`lobby-server/deploy/ntbg/dev/active`

```
blue
```

`lobby-server/deploy/ntbg/dev/blue`

```
BACKEND_PORT=4433
BACKEND_HOSTNAME=example.com
BACKEND_IP=127.0.0.1
```

`lobby-server/deploy/ntbg/dev/green`

```
BACKEND_PORT=4434
BACKEND_HOSTNAME=example.com
BACKEND_IP=127.0.0.1
```

`lobby-server/deploy/ntbg/dev/config`

```
ZONE_ID=na
RULESET_ID=na
RULE_ID=na
```

To build a docker image, run `./deploy/build.sh dev blue`.

To start/restart a docker container, run `./deploy/restart.sh dev blue`

#### Configure the companion app (Electron app)

Create the file `noita-together/nt-app/.env` with the following contents. (Note: Lines beginning with `#` are comments and can be removed.)

```sh
# Deprecate this at some point. Used to construct the URL for refresh tokens.
# Should match the origin of the auth server, with `/api` after it
VUE_APP_HOSTNAME=http://localhost:3000/api
# The URL that the companion app sends users to for OAuth login. Should match
# your OAuth redirect URL
VUE_APP_NT_LOGIN_URL=http://localhost:3000/api/auth/login
# The base URL for lobby server websocket connections. Should match the
# configuration in lobby-server's `.env` file: use `wss` for TLS, `ws`
# for no TLS. If running in Docker, the port is the docker-mapped port
# from the blue/green config. If running directly, it's the app listen
# port configured in `.env`. Include lobby-server's configured WS_PATH
# at the end.
VUE_APP_LOBBY_SERVER_WS_URL_BASE=ws://localhost:4444/ws
```

Be sure you're using Node.JS version 16.20.0: `nvm use 16.20.0`

To start the companion app in dev mode, run `yarn client`

To build an installer for release, run `yarn buildClient`, and look for the output in `noita-together/dist_electron`

While NextJS has hot reload support, the companion app doesn't really support
any change or interruption, so you'll be relaunching it frequently.

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

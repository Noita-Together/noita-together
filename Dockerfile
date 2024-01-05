FROM node:16.20.2-buster
ARG UID=1012
ARG GID=1012
RUN npm install -g pm2
RUN [ $GID -gt 0 ] && [ $UID -gt 0 ] && groupadd -g $GID nginx && useradd -u $UID -g $GID -m -d /noita-together -s /usr/sbin/nologin nginx || true
USER $UID:$GID
WORKDIR /noita-together
ADD --chown=$UID:$GID . .
RUN yarn install
ARG NEXT_PUBLIC_LOBBY_SERVER_API_URL_BASE=https://noitasus.com/api
RUN yarn buildServer
CMD ["bash", "-c", "rm -f /srv/socket/noita-together/noita-together.sock && pm2-runtime ./ecosystem.config.js"]

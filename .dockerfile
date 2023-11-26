FROM node:16.20.2-buster
ARG UID=0
ARG GID=0
RUN npm install -g pm2
RUN [ $GID -gt 0 ] && [ $UID -gt 0 ] && groupadd -g $GID nginx && useradd -u $UID -g $GID -m -d /noita-together -s /usr/sbin/nologin nginx || true
USER $UID:$GID
WORKDIR /noita-together
ADD --chown=$UID:$GID . .
RUN yarn install
RUN yarn buildServer
CMD ["bash", "-c", "yarn server-http"]

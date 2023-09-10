FROM node:16.20.2-buster
RUN which yarn
WORKDIR ./noita-together
RUN npm install pm2 -g
ADD . .
RUN yarn install
CMD ["pm2-runtime", "./ecosystem.config.js"]
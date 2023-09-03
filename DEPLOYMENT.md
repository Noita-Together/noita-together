This will document the process of how the webserver has been deployed

First, we need a DigitalOcean droplet, and a domain
Then we need to add SSL certificates, using the following guide: https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-20-04

For information on using PM2, and NGINX reverse proxy, please see this example
https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-20-04

Special notes:

- This assumes you have configured a Twitch Application
  - Add `https://DOMAIN/api/auth/code` to the redirect URLs
- Run `yarn install`
- Change directory to `nt-web-app/`
- Please setup the following `nt-web-app/.env`:
 
```env
TWITCH_API_KEY= #Get this from Twitch
TWITCH_CLIENT_ID= #Get this from Twitch
OAUTH_REDIRECT_URI=https://DOMAIN.com #change this
WEBSERVER_AUTH_URL=https://DOMAIN.com #change this
NOITA_APP_REDIRECT_URI=http://localhost:25669 #keep this unchanged
DEV_MODE=false
```

- Run `node create-jwt-secret.js`, which will add the following to the .env.
  Please do not share these, or they will allow other users to forge authentication tokens
```env
SECRET_JWT_ACCESS=someaccess-secret
SECRET_JWT_REFRESH=somerefresh-secret
```

Replace the following pm2 configuration with:

`pm2 start yarn --name nt-server -- server` where --name can be whatever you want

Then we need to add some steps to the NT client to point it at this

Add the following to the nt-app .env, then build executables for it :)
```env
VUE_APP_HOSTNAME=https://DOMAIN/api # ex. https://example.com/api
VUE_APP_WS_PORT=:5466
VUE_APP_HOSTNAME_WS=DOMAIN # ex. example.com
```
server {
    # Enable HTTP/2
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN; #ex. noita-together.example.com

    # Use the Let’s Encrypt certificates
    ssl_certificate /etc/letsencrypt/live/DOMAIN/fullchain.pem; #ex. /etc/letsencrypt/live/noita-together.example.com/fullchain.pem
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN/privkey.pem; #ex. /etc/letsencrypt/live/noita-together.example.com/privkey.pem

    # Include the SSL configuration from cipherli.st
    include snippets/ssl-params.conf;

    location / {
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-NginX-Proxy true;
        proxy_pass http://localhost:3000;
        proxy_ssl_session_reuse off;
        proxy_set_header Host $http_host;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
    }
}
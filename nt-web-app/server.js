const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
// const WebsocketRunner = require('./websocket')

app.prepare().then(() => {
    createServer(async (req, res) => {
        try {
            // Be sure to pass `true` as the second argument to `url.parse`.
            // This tells it to parse the query portion of the URL.
            const parsedUrl = parse(req.url, true);
            const { pathname, query } = parsedUrl;

            if (pathname === '/a') {
                res.end('<!DOCTYPE html>\n' +
                    '<html>\n' +
                    '<head>\n' +
                    '  <style>\n' +
                    '    body {\n' +
                    '      background-color: black;\n' +
                    '      display: flex;\n' +
                    '      justify-content: center;\n' +
                    '      align-items: center;\n' +
                    '      height: 100vh;\n' +
                    '      margin: 0;\n' +
                    '    }\n' +
                    '\n' +
                    '    h1 {\n' +
                    '      color: white;\n' +
                    '      text-align: center;\n' +
                    '      font-family: Arial, sans-serif;\n' +
                    '      font-size: 24px;\n' +
                    '    }\n' +
                    '  </style>\n' +
                    '</head>\n' +
                    '<body>\n' +
                    '  <h1>you can close this</h1>\n' +
                    '</body>\n' +
                    '</html>\n')
            } else if (pathname === '/b') {
                await app.render(req, res, '/b', query);
            } else {
                await handle(req, res, parsedUrl);
            }
        } catch (err) {
            console.error('Error occurred handling', req.url, err);
            res.statusCode = 500;
            res.end('internal server error');
        }
    })
        .once('error', (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});
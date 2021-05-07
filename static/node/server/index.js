//TOKEN:^SERVER__UNSECURE
const httpModule = require('http');
//TOKEN:$SERVER__UNSECURE
//TOKEN:^SERVER__SECURE
const { readFileSync } = require('fs');
const httpModule = require('https');
//TOKEN:$SERVER__SECURE
//TOKEN:^SERVER__COMPRESS
const compression = require('compression');
//TOKEN:$SERVER__COMPRESS
//TOKEN:^SERVER__COOKIES
const cookieParser = require('cookie-parser');
//TOKEN:$SERVER__COOKIES
//TOKEN:^SERVER__FRAMEWORK__EXPRESS
const express = require('express');
//TOKEN:$SERVER__FRAMEWORK__EXPRESS
//TOKEN:^SERVER__FRAMEWORK__POLKA
const polka = require('polka');
//TOKEN:$SERVER__FRAMEWORK__POLKA
//TOKEN:^SERVER__STATIC
const sirv = require('sirv');
//TOKEN:$SERVER__STATIC
const {
  SERVER__PORT,
  //TOKEN:^SERVER__WEBSOCKET
  WS__MSG_TYPE__SERVER_DOWN,
  //TOKEN:$SERVER__WEBSOCKET
} = require('../constants');
const log = require('../utils/logger')('server');
//TOKEN:^SERVER__WEBSOCKET
const socket = require('./socket');
//TOKEN:$SERVER__WEBSOCKET
const shell = require('./shell');

const { NODE_ENV } = process.env;
//TOKEN:^SERVER__SECURE
const PROTOCOL = 'https';
//TOKEN:$SERVER__SECURE
//TOKEN:^SERVER__UNSECURE
const PROTOCOL = 'http';
//TOKEN:$SERVER__UNSECURE
const dev = NODE_ENV !== 'production';
const middleware = [
  //TOKEN:^SERVER__COMPRESS
  compression({ threshold: 0 }),
  //TOKEN:$SERVER__COMPRESS
  //TOKEN:^SERVER__STATIC
  sirv('./dist/public', { dev, etag: true }),
  //TOKEN:$SERVER__STATIC
  //TOKEN:^SERVER__COOKIES
  cookieParser(),
  //TOKEN:$SERVER__COOKIES
];
//TOKEN:^SERVER__FRAMEWORK__EXPRESS
const app = express();
//TOKEN:$SERVER__FRAMEWORK__EXPRESS
//TOKEN:^SERVER__FRAMEWORK__NODE

function app(req, res) {
  let funcNdx = 0;
  
  const next = (inc = true) => {
    if (inc) funcNdx += 1;
    if (app.reqFuncs[funcNdx]) app.reqFuncs[funcNdx](req, res, next);
  };
  
  next(false);
}
app.reqFuncs = [];
app.get = function get(path, handler) {
  app.reqFuncs.push((req, res, next) => {
    if (req.url === path) handler(req, res);
    else next();
  });
  return app;
};
app.use = function use(...middleware) {
  app.reqFuncs.push(...middleware);
  return app;
};
//TOKEN:$SERVER__FRAMEWORK__NODE
//TOKEN:^SERVER__FRAMEWORK__POLKA
const app = polka();
//TOKEN:$SERVER__FRAMEWORK__POLKA

app
  .use(...middleware)
  .get('/api', (req, res) => {
    res.end('hi');
  })
  .get('/', (req, res) => {
    res.end(shell({
      view: 'app', // usually tied to the `entry` name in your bundler
    }));
  });

const server = httpModule.createServer({
  //TOKEN:^SERVER__SECURE
  // TODO - add script to generate certs or ask for path of certs
  cert: readFileSync('/path/to/cert.pem'),
  key: readFileSync('/path/to/key.pem'),
  //TOKEN:$SERVER__SECURE
}, //TOKEN:#SERVER__APP_HANDLER);

server.listen(SERVER__PORT, err => {
  if (err) log.error('Error', err);
  log.info(`Server running at: ${PROTOCOL}://localhost:${SERVER__PORT}`);
});

//TOKEN:^SERVER__WEBSOCKET
const serverSocket = socket(server);

// TODO - https://github.com/the0neWhoKnocks/sloff/blob/master/src/server/socket/index.js
// function handleServerDeath(signal) {
//   log.info(`\n[${signal}] Server closing`);
// 
//   // NOTE - I've seen this NOT work if there are some zombie WS processes
//   // floating around from a previous bad run. So try killing all `node`
//   // instances and see if things work after.
//   // NOTE - This also only works when the WS isn't being proxied via BrowserSync
//   // while in development. So if you go to the non-proxied port, things will
//   // behave as expected.
//   serverSocket.emitToAll(WS__MSG_TYPE__SERVER_DOWN);
//   serverSocket.serverInstance.close();
// 
//   server.close(() => {
//     log.info(`[${signal}] Server closed`);
//     process.exit(0);
//   });
// }
// 
// [
//   'SIGINT', 
//   'SIGQUIT',
//   'SIGTERM', 
// ].forEach(signal => process.on(signal, handleServerDeath));
//TOKEN:$SERVER__WEBSOCKET

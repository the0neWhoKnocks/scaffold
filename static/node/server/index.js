//TOKEN:^SERVER__COMPRESS
const compression = require('compression');
//TOKEN:$SERVER__COMPRESS
//TOKEN:^SERVER__COOKIES
const cookieParser = require('cookie-parser');
//TOKEN:$SERVER__COOKIES
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

//TOKEN:^SERVER__FRAMEWORK__POLKA
const { server } = polka()
//TOKEN:$SERVER__FRAMEWORK__POLKA
  .use(...middleware)
  .get('/', (req, res) => {
    res.end(shell({
      view: 'app', // usually tied to the `entry` name in your bundler
    }));
  })
  .listen(SERVER__PORT, err => {
    if (err) log('Error', err);
    log(`Server running at: http://localhost:${SERVER__PORT}`);
  });

//TOKEN:^SERVER__WEBSOCKET
const serverSocket = socket(server);

// TODO - https://github.com/the0neWhoKnocks/sloff/blob/master/src/server/socket/index.js
// function handleServerDeath(signal) {
//   log(`\n[${signal}] Server closing`);
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
//     log(`[${signal}] Server closed`);
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

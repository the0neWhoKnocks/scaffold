const { STATUS_CODES } = require('http');
//TOKEN:#SERVER__FS
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
//TOKEN:^SERVER__MULTI_USER
const bodyParser = require('body-parser');
const mkdirp = require('mkdirp');
//TOKEN:$SERVER__MULTI_USER
const {
  //TOKEN:^SERVER__MULTI_USER
  PATH__CONFIG,
  PATH__DATA,
  //TOKEN:$SERVER__MULTI_USER
  PATH__PUBLIC,
  //TOKEN:^SERVER__MULTI_USER
  ROUTE__API__CONFIG_CREATE,
  //TOKEN:$SERVER__MULTI_USER
  //TOKEN:^SERVER__API
  ROUTE__API__HELLO,
  //TOKEN:$SERVER__API
  //TOKEN:^SERVER__MULTI_USER
  ROUTE__API__USER_CREATE,
  ROUTE__API__USER_GET_DATA,
  ROUTE__API__USER_GET_PROFILE,
  ROUTE__API__USER_LOGIN,
  ROUTE__API__USER_SET_DATA,
  ROUTE__API__USER_SET_PROFILE,
  //TOKEN:$SERVER__MULTI_USER
  SERVER__PORT,
  //TOKEN:^SERVER__WEBSOCKET
  WS__MSG__SERVER_DOWN,
  //TOKEN:$SERVER__WEBSOCKET
} = require('../constants');
const log = require('../utils/logger')('server');
//TOKEN:^SERVER__MULTI_USER
const createConfig = require('./api/config.create');
const createUser = require('./api/user.create');
const getUserData = require('./api/user.data.get');
const setUserData = require('./api/user.data.set');
const userLogin = require('./api/user.login');
const getUserProfile = require('./api/user.profile.get');
const setUserProfile = require('./api/user.profile.set');
//TOKEN:$SERVER__MULTI_USER
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
  sirv(PATH__PUBLIC, { dev, etag: true }),
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
  const [url] = req.url.split('?');
  const handlers = [...app.reqHandlers.middleware];
  const pathHandlers = app.reqHandlers.methods[req.method][url];
  let funcNdx = 0;
  
  if (pathHandlers) handlers.push(...pathHandlers);
  handlers.push(app.notFoundHandler);
  
  const next = () => {
    if (handlers[funcNdx]) {
      funcNdx++;
      handlers[funcNdx-1](req, res, next);
    }
  };
  
  next();
}
app.reqHandlers = {
  methods: {
    GET: {},
    POST: {},
  },
  middleware: [],
};
app.pathHandler = (method) => function pathHandler(path, ...handlers) {
  app.reqHandlers.methods[method][path] = handlers;
  return app;
};
app.notFoundHandler = function notFound(req, res) {
  const CODE = 404;
  const body = STATUS_CODES[CODE];
  
  log.debug(`Nothing found for "${req.url}"`);
  
  res
    .writeHead(CODE, {
      'Content-Length': Buffer.byteLength(body),
      'Content-Type': 'text/plain',
    })
    .end(body);
};
app.get = app.pathHandler('GET');
app.post = app.pathHandler('POST');
app.use = function use(...middleware) {
  app.reqHandlers.middleware.push(...middleware);
  return app;
};
//TOKEN:$SERVER__FRAMEWORK__NODE
//TOKEN:^SERVER__FRAMEWORK__POLKA
const app = polka();
//TOKEN:$SERVER__FRAMEWORK__POLKA
//TOKEN:^SERVER__MULTI_USER
const jsonParser = bodyParser.json();

if (!existsSync(PATH__DATA)) mkdirp.sync(PATH__DATA);
//TOKEN:$SERVER__MULTI_USER

app
  .use(...middleware)
  .use((req, res, next) => {
    //TOKEN:^SERVER__MULTI_USER
    if (existsSync(PATH__CONFIG)) req.appConfig = JSON.parse(readFileSync(PATH__CONFIG, 'utf8'));
    
    //TOKEN:$SERVER__MULTI_USER
    res.sendJSON = (data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    };
    
    res.sendError = (statusCode, error) => {
      log.error(`[${statusCode}] | ${error}`);
      res.statusCode = statusCode;
      // NOTE - utilizing `message` so that if an Error is thrown on the Client
      // within a `then`, there's no extra logic to get error data within the
      // `catch`.
      res.sendJSON({ message: error });
    };
    
    next();
  })
  //TOKEN:^SERVER__MULTI_USER
  .post(ROUTE__API__CONFIG_CREATE, jsonParser, createConfig)
  .post(ROUTE__API__USER_GET_DATA, jsonParser, getUserData)
  .post(ROUTE__API__USER_GET_PROFILE, jsonParser, getUserProfile)
  .post(ROUTE__API__USER_CREATE, jsonParser, createUser)
  .post(ROUTE__API__USER_LOGIN, jsonParser, userLogin)
  .post(ROUTE__API__USER_SET_DATA, jsonParser, setUserData)
  .post(ROUTE__API__USER_SET_PROFILE, jsonParser, setUserProfile)
  //TOKEN:$SERVER__MULTI_USER
  //TOKEN:^SERVER__API
  .get(ROUTE__API__HELLO, (req, res) => {
    const { parse: parseQuery } = require('querystring');
    const { parse: parseURL } = require('url');
    const params = { ...parseQuery(parseURL(req.url).query) };
    log.info(`[API] Recieved params: ${JSON.stringify(params)}`);
    res.sendJSON({ hello: 'dave' });
  })
  //TOKEN:$SERVER__API
  .get('/', (req, res) => {
    res.end(shell({
      //TOKEN:^SERVER__MULTI_USER
      props: { configExists: !!req.appConfig },
      //TOKEN:$SERVER__MULTI_USER
      view: 'app', // usually tied to the `entry` name in your bundler
    }));
  });

let httpModule;
let protocol = 'http';
let serverOpts = {};
if (process.env.NODE_EXTRA_CA_CERTS) {
  serverOpts.cert = readFileSync(process.env.NODE_EXTRA_CA_CERTS, 'utf8');
  serverOpts.key = readFileSync(process.env.NODE_EXTRA_CA_CERTS.replace('.crt', '.key'), 'utf8');
  httpModule = require('https');
  protocol = 'https';
}
else httpModule = require('http');

const server = httpModule.createServer(serverOpts, /* TOKEN:#SERVER__APP_HANDLER */);

server.listen(SERVER__PORT, err => {
  if (err) log.error('Error', err);
  //TOKEN:^SERVER__VHOST
  
  let domain = 'localhost';
  let port = SERVER__PORT;
  
  if (process.env.VIRTUAL_HOST) {
    domain = process.env.VIRTUAL_HOST;
    port = process.env.VHOST_PROXY_PORT;
    protocol = 'https';
  }
  
  log.info(`Server running at: ${protocol}://${domain}:${port}`);
  //TOKEN:$SERVER__VHOST
  //TOKEN:^SERVER__NO_VHOST
  log.info(`Server running at: ${protocol}://localhost:${SERVER__PORT}`);
  //TOKEN:$SERVER__NO_VHOST
});

//TOKEN:^SERVER__WEBSOCKET
const serverSocket = socket(server);
const serverConnections = new Set();
const deathSignals = [
  'SIGINT', 
  'SIGQUIT',
  'SIGTERM', 
];
server.on('connection', connection => {
  serverConnections.add(connection);
  connection.on('close', () => {
    serverConnections.delete(connection);
  });
});

function destroyConnections() {
  for (const connection of serverConnections.values()) {
    connection.destroy();
  }
}

function handleServerDeath(signal) {
  log.info(`[${signal}] Server closing`);

  // NOTE - I've seen this NOT work if there are some zombie WS processes
  // floating around from a previous bad run. So try killing all `node`
  // instances and see if things work after.
  // NOTE - This also only works when the WS isn't being proxied via BrowserSync
  // while in development. So if you go to the non-proxied port, things will
  // behave as expected.
  serverSocket.emitToAll(WS__MSG__SERVER_DOWN);
  serverSocket.close();

  server.close(() => {
    log.info(`[${signal}] Server closed`);
    process.kill(process.pid, signal);
  });
  destroyConnections();
}

deathSignals.forEach(signal => process.once(signal, handleServerDeath));
//TOKEN:$SERVER__WEBSOCKET

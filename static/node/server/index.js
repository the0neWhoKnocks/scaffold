//TOKEN:^SERVER__FRAMEWORK__NODE
const { STATUS_CODES } = require('node:http');
//TOKEN:$SERVER__FRAMEWORK__NODE
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
  //TOKEN:^SERVER__EXT_API
  ROUTE__API__EXT,
  //TOKEN:$SERVER__EXT_API
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
  WS__MSG__CONNECTED_TO_SERVER,
  WS__MSG__EXAMPLE,
  //TOKEN:^SERVER__VHOST
  WS__MSG__PING,
  WS__MSG__PONG,
  //TOKEN:$SERVER__VHOST
  WS__MSG__SERVER_UP,
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
//TOKEN:^SERVER__MIDDLEWARE
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
//TOKEN:$SERVER__MIDDLEWARE
//TOKEN:^SERVER__FRAMEWORK__EXPRESS
const app = express();
//TOKEN:$SERVER__FRAMEWORK__EXPRESS
//TOKEN:^SERVER__FRAMEWORK__NODE

function app(req, res) {
  const [url] = req.url.split('?');
  const handlers = app.reqHandlers.reduce((arr, { handlers, path, type }) => {
    switch (type) {
      case 'GET':
      case 'POST': {
        if (req.method === type && url === path) arr.push(...handlers);
        break;
      }
      default: arr.push(...handlers);
    }
    return arr;
  }, []);
  let funcNdx = 0;
  
  handlers.push(app.notFoundHandler);
  
  const next = (err) => {
    if (err) res.error(err);
    else if (handlers[funcNdx]) {
      funcNdx++;
      handlers[funcNdx-1](req, res, next);
    }
  };
  
  next();
}
app.reqHandlers = [];
app.pathHandler = (method) => function pathHandler(path, ...handlers) {
  app.reqHandlers.push({ handlers, path, type: method });
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
app.use = function use(...handlers) {
  if (handlers.length) app.reqHandlers.push({ handlers, type: 'use' });
  return app;
};
//TOKEN:$SERVER__FRAMEWORK__NODE
//TOKEN:^SERVER__FRAMEWORK__POLKA
const app = polka();
//TOKEN:$SERVER__FRAMEWORK__POLKA
//TOKEN:^SERVER__MULTI_USER
const jsonParser = bodyParser.json({
  limit: '100mb', // default is '100kb'
});

if (!existsSync(PATH__DATA)) mkdirp.sync(PATH__DATA);
//TOKEN:$SERVER__MULTI_USER

app
  .use((req, res, next) => {
    if (!res.error) {
      res.error = (...err) => {
        let error;
        let statusCode;
        
        if (typeof err[0] === 'number') {
          const [c, e] = err;
          error = e;
          statusCode = c;
        }
        else if (err[0] instanceof Error) {
          const { message: e, statusCode: c } = err[0];
          error = e;
          statusCode = c;
        }
        
        log.error(`[${statusCode}] | ${error}`);
        // NOTE - utilizing `message` so that if an Error is thrown on the Client
        // within a `then`, there's no extra logic to get error data within the
        // `catch`.
        res.status(statusCode).json({ message: error });
      };
    }
    
    if (!res.json) {
      res.json = (data) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      };
    }
    
    if (!res.status) {
      res.status = (statusCode) => {
        res.statusCode = statusCode;
        return res;
      };
    }
  
    next();
  })
  //TOKEN:^SERVER__MIDDLEWARE
  .use(...middleware)
  //TOKEN:$SERVER__MIDDLEWARE
  //TOKEN:^SERVER__MULTI_USER
  .use((req, res, next) => {
    if (existsSync(PATH__CONFIG)) req.appConfig = JSON.parse(readFileSync(PATH__CONFIG, 'utf8'));
    next();
  })
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
    const { parse: parseQuery } = require('node:querystring');
    const { parse: parseURL } = require('node:url');
    const params = { ...parseQuery(parseURL(req.url).query) };
    log.info(`[API] Recieved params: ${JSON.stringify(params)}`);
    res.json({ hello: 'dave' });
  })
  //TOKEN:$SERVER__API
  //TOKEN:^SERVER__EXT_API
  .get(ROUTE__API__EXT, async (req, res) => {
    log.info(`[EXT_API] Calling external API`);
    try {
      const resp = await fetch('https://opentdb.com/api.php?amount=1');
      
      if (!resp.ok) return res.error(resp.status);
        
      log.info(`[EXT_API] Recieved response`);
      const { results: [{ correct_answer, question }] } = await resp.json();
      res.json({ answer: correct_answer, question });
    }
    catch (err) { return res.error(err); }
  })
  //TOKEN:$SERVER__EXT_API
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
  httpModule = require('node:https');
  protocol = 'https';
}
else httpModule = require('node:http');

const server = httpModule.createServer(serverOpts, /* TOKEN:#SERVER__APP_HANDLER */);
//TOKEN:^SERVER__WEBSOCKET
const wss = socket(server, {
  handleClientConnection: function handleClientConnection(wss) {
    wss.dispatchToClient(WS__MSG__CONNECTED_TO_SERVER, { id: wss.id, msg: 'App connected to Server' });
  },
  msgHandlers: {
    client: {
      [WS__MSG__EXAMPLE]: function handleExample(wss, data) {
        wss.dispatchToClient(WS__MSG__EXAMPLE, {
          msg: `Client: ${data.d} | Server: ${Date.now()}`,
        });
      },
      //TOKEN:^SERVER__VHOST
      [WS__MSG__PING]: function handlePing(wss) {
        wss.dispatchToClient(WS__MSG__PONG, {});
      },
      //TOKEN:$SERVER__VHOST
    },
    server: {
      [WS__MSG__SERVER_UP]: function handleServerStart(wss) {
        log.info('Starting long running process');
        
        let count = 1;
        const procInt = setInterval(() => {
          if (count < 6) {
            wss.dispatchToClients(WS__MSG__EXAMPLE, { msg: `Server process progress: ${count}` });
            count += 1;
          }
          else {
            clearInterval(procInt);
            wss.dispatchToClients(WS__MSG__EXAMPLE, { msg: 'Server process complete' });
          }
        }, 2000);
      },
    },
  }
});
//TOKEN:$SERVER__WEBSOCKET

server.listen(SERVER__PORT, err => {
  if (err) log.error('Error', err);
  //TOKEN:^SERVER__VHOST
  
  let domain = 'localhost';
  let port = `:${SERVER__PORT}`;
  
  if (process.env.VIRTUAL_HOST) {
    domain = process.env.VIRTUAL_HOST;
    port = (
      process.env.VHOST_PROXY_PORT === '80'
      || process.env.VHOST_PROXY_PORT === '443'
    )
      ? ''
      : `:${process.env.VHOST_PROXY_PORT}`;
    //TOKEN:^SERVER__HTTPS
    protocol = 'https';
    //TOKEN:$SERVER__HTTPS
  }
  
  log.info(`Server running at: ${protocol}://${domain}${port}`);
  //TOKEN:$SERVER__VHOST
  //TOKEN:^SERVER__NO_VHOST
  log.info(`Server running at: ${protocol}://localhost:${SERVER__PORT}`);
  //TOKEN:$SERVER__NO_VHOST
  //TOKEN:^SERVER__WEBSOCKET
  
  wss.dispatch(WS__MSG__SERVER_UP);
  //TOKEN:$SERVER__WEBSOCKET
});

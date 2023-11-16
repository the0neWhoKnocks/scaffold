const { OPEN, WebSocketServer } = require('ws');
const { WS__MSG__SERVER_DOWN } = require('../constants');
const log = require('../utils/logger')('server:socket');

function accountForServerDeath(server) {
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
    server.wss.dispatchToClients(WS__MSG__SERVER_DOWN);
    server.wss.closeConnections();

    server.close(() => {
      log.info(`[${signal}] Server closed`);
      process.kill(process.pid, signal);
    });
    destroyConnections();
  }

  deathSignals.forEach(signal => process.once(signal, handleServerDeath));
}

function genUniqueId() {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${s4()}${s4()}-${s4()}`;
}

module.exports = function socket(server, opts = {}) {
  const wss = new WebSocketServer({ server });
  
  // NOTE: The `request` and `response` objects in a `request` handler have 
  // `client` and `socket` props which are the same `Socket` instance but have 
  // nothing to do with `ws`, they're exposed by Node's `http` module. Just
  // stating for clarity since it can be confusing.
  // The easiest way for request handlers to utilize this API is via one of the
  // mentioned props, though I feel the `client` prop is less confusing.
  // Example: `req.client.server.wss.<FN>`.
  server.wss = {
    closeConnections() {
      wss.close();
    },
    dispatch(type, data = {}) {
      wss.emit('message', JSON.stringify({ data, type }));
    },
    dispatchToClients(type, data = {}) {
      wss.clients.forEach((socket) => {
        if (socket.readyState === OPEN) socket.send(JSON.stringify({ data, type }));
      });
    },
  };
  
  wss.on('message', function handleServerMessage(payload) {
    const { data, type } = JSON.parse(payload);
    
    log.info(`[HANDLE] Server message: "${type}"`);
    
    const serverHandlers = opts?.msgHandlers?.server || {};
    const msgKeys = Object.keys(serverHandlers);
    let msgFound = false;
    for (let k=0; k<msgKeys.length; k++) {
      if (msgKeys[k] === type) {
        const fn = serverHandlers[msgKeys[k]];
        if (fn) {
          fn(server.wss, data);
          msgFound = true;
          break;
        }
      }
    }
    
    if (!msgFound) log.warn(`No handler for "${type}", data lost: ${JSON.stringify(data)}`);
  });
  
  wss.on('connection', function handleClientConnection(socket) {
    log.info('Client connected');
    
    const _wss = {
      ...server.wss,
      clientSocket: socket,
      dispatchToClient(type, data = {}) {
        if (socket.readyState === OPEN) socket.send(JSON.stringify({ data, type }));
      },
      id: genUniqueId(),
    };
    
    if (opts.handleClientConnection) opts.handleClientConnection(_wss);
    
    socket.on('message', function handleClientMessage(payload) {
      const { data, type } = JSON.parse(payload);
    
      log.info(`[HANDLE] Client message: "${type}"`);
      
      const clientHandlers = opts?.msgHandlers?.client || {};
      const msgKeys = Object.keys(clientHandlers);
      let msgFound = false;
      for (let k=0; k<msgKeys.length; k++) {
        if (msgKeys[k] === type) {
          const fn = clientHandlers[msgKeys[k]];
          if (fn) {
            fn(_wss, data);
            msgFound = true;
            break;
          }
        }
      }
      
      if (!msgFound) log.warn(`No handler for "${type}", data lost: ${JSON.stringify(data)}`);
    });
    
    socket.on('close', (code, reason) => {
      log.info(`Client disconnected | ${code} | ${reason}`);
    });
  });
  
  accountForServerDeath(server);
  
  return server.wss;
}

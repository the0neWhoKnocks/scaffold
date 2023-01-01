const { OPEN, Server } = require('ws');
const {
  WS__MSG__EXAMPLE,
  WS__MSG__SERVER_DOWN,
  //TOKEN:^SERVER_SOCKET__VHOST
  WS__MSG__PING,
  WS__MSG__PONG,
  //TOKEN:$SERVER_SOCKET__VHOST
} = require('../constants');
const log = require('../utils/logger')('server:socket');

function accountForServerDeath(server, serverSocket) {
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
}

module.exports = function socket(server) {
  const wss = new Server({ server });
  
  wss.on('connection', function connected(socket) {
    log.info('Client connected');
    server.clientSocket = socket;
    
    socket.on('message', (payload) => {
      const { data, type } = JSON.parse(payload);
    
      log.info(`[HANDLE] "${ type }"`);
      
      switch (type) {
        case WS__MSG__EXAMPLE:
          socket.send(JSON.stringify({
            data: { msg: `Client: ${data.d} | Server: ${Date.now()}` },
            type: WS__MSG__EXAMPLE,
          }));
          break;
        //TOKEN:^SERVER_SOCKET__VHOST
        
        case WS__MSG__PING:
          socket.send(JSON.stringify({ data: {}, type: WS__MSG__PONG }));
          break;
        //TOKEN:$SERVER_SOCKET__VHOST
      }
    });
    
    socket.on('close', (code, reason) => {
      log.info(`Client disconnected | ${code} | ${reason}`);
      delete server.clientSocket;
    });
  });
  
  const serverSocket = {
    close() {
      wss.close();
    },
    emitToAll(type, data = {}) {
      wss.clients.forEach((socket) => {
        if (socket.readyState === OPEN) {
          socket.send(JSON.stringify({ data, type }));
        }
      });
    },
  };
  
  accountForServerDeath(server, serverSocket);
  
  return serverSocket;
}

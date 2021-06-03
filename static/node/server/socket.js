const { OPEN, Server } = require('ws');
const {
  WS__MSG__EXAMPLE,
  //TOKEN:^SERVER_SOCKET__VHOST
  WS__MSG__PING,
  WS__MSG__PONG,
  //TOKEN:$SERVER_SOCKET__VHOST
} = require('../constants');
const log = require('../utils/logger')('server:socket');

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
  
  return {
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
}

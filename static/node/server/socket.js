const { OPEN, Server } = require('ws');
const { WS__MSG__EXAMPLE } = require('../constants');
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
        case WS__MSG__EXAMPLE: {
          socket.send(JSON.stringify({
            data: { msg: `Client: ${data.d} | Server: ${Date.now()}` },
            type: WS__MSG__EXAMPLE,
          }));
          
          break;
        }
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

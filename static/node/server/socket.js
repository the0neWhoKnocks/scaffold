const { Server } = require('ws');
const { WS__EXAMPLE_MSG } = require('../constants');
const log = require('../utils/logger')('server:socket');

module.exports = function socket(server) {
  const wss = new Server({ server });
  
  wss.on('connection', function connected(socket) {
    log('Client connected');
    server.clientSocket = socket;
    
    socket.on('message', (payload) => {
      const { data, type } = JSON.parse(payload);
    
      log(`[HANDLE] "${ type }"`);
      
      switch(type) {
        case WS__EXAMPLE_MSG: {
          socket.send(JSON.stringify({
            data: { msg: `Client: ${data.d} | Server: ${Date.now()}` },
            type: WS__EXAMPLE_MSG,
          }));
          
          break;
        }
      }
    });
    
    socket.on('close', (code, reason) => {
      log(`User disconnected | ${code} | ${reason}`);
      delete server.clientSocket;
    });
  });
  
  return wss;
}

const { Server } = require('ws');
const log = require('../utils/logger')('server:socket');

module.exports = function socket(server) {
  const wss = new Server({ server });
  
  wss.on('connection', function connected(socket) {
    log('Client connected');
    server.clientSocket = socket;
    
    // socket.on('message', (payload) => {
    //   const { /* data, */ type } = JSON.parse(payload);
    // 
    //   log(`[HANDLE] "${ type }"`);
    // });
    
    socket.on('close', (code, reason) => {
      log('User disconnected');
      delete server.clientSocket;
    });
  });
  
  return wss;
}

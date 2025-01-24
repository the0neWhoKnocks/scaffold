module.exports = function handleClientConnect(wss) {
  const { WS__MSG__CONNECTED_TO_SERVER } = require('../../constants');
  
  wss.dispatchToClient(WS__MSG__CONNECTED_TO_SERVER, { id: wss.id, msg: 'App connected to Server' });
}

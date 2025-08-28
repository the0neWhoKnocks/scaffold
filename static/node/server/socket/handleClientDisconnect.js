module.exports = function handleClientDisconnect(wss, code, reason) {
  const { WS__CLOSE_CODE__DISCONNECTED } = require('../../constants');
  
  wss.dispatchToClient(WS__CLOSE_CODE__DISCONNECTED, {
    id: wss.id,
    msg: `User '${wss.id}' disconnected | code: ${code} | reason: ${reason}`,
  });
};

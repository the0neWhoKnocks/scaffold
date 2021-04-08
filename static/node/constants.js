// Shared by both Client and Server
const constants = {
  APP__TITLE: '//TOKEN:#CONST__APP_TITLE',
  //TOKEN:^CONST__SVELTE_MNT
  DOM__SVELTE_MOUNT_POINT: 'view',
  //TOKEN:$CONST__SVELTE_MNT
  //TOKEN:^CONST__LOGGER_NAMESPACE
  LOGGER__NAMESPACE: '//TOKEN:#CONST__LOGGER_NAMESPACE',
  //TOKEN:$CONST__LOGGER_NAMESPACE
  //TOKEN:^CONST__WEB_SOCKETS
  WS__CLOSE_CODE__USER_REMOVED: 4000, // Close event numbers https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
  WS__EXAMPLE_MSG: 'test one two',
  //TOKEN:$CONST__WEB_SOCKETS
};

//TOKEN:^CONST__SERVER
// Server only
if (!process.env.FOR_CLIENT_BUNDLE) {
  constants.DISCONNECT_TIMEOUT = 5000;
  constants.SERVER__PORT = +process.env.SERVER_PORT || 3000;
}
//TOKEN:$CONST__SERVER

module.exports = constants;

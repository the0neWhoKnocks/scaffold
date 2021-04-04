module.exports = {
  APP__TITLE: '//TOKEN:#CONST__APP_TITLE',
  DISCONNECT_TIMEOUT: 5000,
  //TOKEN:^CONST__SVELTE_MNT
  DOM__SVELTE_MOUNT_POINT: 'view',
  //TOKEN:$CONST__SVELTE_MNT
  //TOKEN:^CONST__LOGGER_NAMESPACE
  LOGGER__NAMESPACE: '//TOKEN:#CONST__LOGGER_NAMESPACE',
  //TOKEN:$CONST__LOGGER_NAMESPACE
  SERVER__PORT: +process.env.SERVER_PORT || 3000,
  //TOKEN:^CONST__WS_MESSAGES
  WS__CLOSE_CODE__USER_REMOVED: 4000, // Close event numbers https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
  //TOKEN:$CONST__WS_MESSAGES
};
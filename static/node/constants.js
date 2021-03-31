module.exports = {
  APP__TITLE: '{TOKEN__APP_TITLE}',
  DISCONNECT_TIMEOUT: 5000,
  //{TOKEN:^__CONST__SVELTE_MNT}
  DOM__SVELTE_MOUNT_POINT: 'view',
  //{TOKEN:$__CONST__SVELTE_MNT}
  //{TOKEN:^__CONST__LOGGER_NAMESPACE}
  LOGGER__NAMESPACE: 'sloff',
  //{TOKEN:$__CONST__LOGGER_NAMESPACE}
  SERVER__PORT: +process.env.SERVER_PORT || 3000,
  //{TOKEN:^__CONST__WS_MESSAGES}
  WS__CLOSE_CODE__USER_REMOVED: 4000, // Close event numbers https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
  //{TOKEN:$__CONST__WS_MESSAGES}
};
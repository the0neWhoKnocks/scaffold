//TOKEN:^CONST__HAS_API
const API_PREFIX = '/api';
//TOKEN:$CONST__HAS_API
//TOKEN:^CONST__MULTI_USER
const NAMESPACE__STORAGE = '//TOKEN:#CONST__STORAGE_NAMESPACE';
//TOKEN:$CONST__MULTI_USER

// Shared by both Client and Server
const constants = {
  APP__TITLE: '//TOKEN:#CONST__APP_TITLE',
  //TOKEN:^CONST__SVELTE_MNT
  DOM__SVELTE_MOUNT_POINT: 'view',
  //TOKEN:$CONST__SVELTE_MNT
  NAMESPACE__LOGGER: '//TOKEN:#CONST__LOGGER_NAMESPACE',
  //TOKEN:^CONST__MULTI_USER
  NAMESPACE__STORAGE,
  NAMESPACE__STORAGE__USER: `${NAMESPACE__STORAGE}.user`,
  ROUTE__API__CONFIG_CREATE: `${API_PREFIX}/config/create`,
  //TOKEN:$CONST__MULTI_USER
  //TOKEN:^CONST__EXT_API
  ROUTE__API__EXT: `/ext`,
  //TOKEN:$CONST__EXT_API
  //TOKEN:^CONST__API
  ROUTE__API__HELLO: `${API_PREFIX}/hello`,
  //TOKEN:$CONST__API
  //TOKEN:^CONST__MULTI_USER
  ROUTE__API__USER_GET_DATA: `${API_PREFIX}/user/data`,
  ROUTE__API__USER_GET_PROFILE: `${API_PREFIX}/user/profile`,
  ROUTE__API__USER_CREATE: `${API_PREFIX}/user/create`,
  ROUTE__API__USER_LOGIN: `${API_PREFIX}/user/login`,
  ROUTE__API__USER_SET_DATA: `${API_PREFIX}/user/data/set`,
  ROUTE__API__USER_SET_PROFILE: `${API_PREFIX}/user/profile/set`,
  //TOKEN:$CONST__MULTI_USER
  //TOKEN:^CONST__VHOST
  NGINX_WS_TIMEOUT: 60000, // WS connections will disconnect after this amount of time, unless the Server is pinged
  //TOKEN:$CONST__VHOST
  //TOKEN:^CONST__WEB_SOCKETS
  WS__CLOSE_CODE__USER_REMOVED: 4000, // Close event numbers https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent
  WS__MSG__CONNECTED_TO_SERVER: 'connected to server',
  WS__MSG__EXAMPLE: 'example',
  //TOKEN:^CONST__VHOST
  WS__MSG__PING: 'ping',
  WS__MSG__PONG: 'pong',
  //TOKEN:$CONST__VHOST
  WS__MSG__SERVER_DOWN: 'server down',
  WS__MSG__SERVER_UP: 'server up',
  //TOKEN:$CONST__WEB_SOCKETS
};
//TOKEN:^CONST__SERVER

if (!process.env.FOR_CLIENT_BUNDLE) {
  // Server only (will be stripped out via WP)
  const { resolve } = require('node:path');
  
  const ROOT_PATH = resolve(__dirname, './');
  //TOKEN:^CONST__MULTI_USER
  const DATA_PATH = process.env.DATA_PATH || `${ROOT_PATH}/../data`;
  //TOKEN:$CONST__MULTI_USER
  
  Object.assign(constants, {
    //TOKEN:^CONST__MULTI_USER
    CRYPT__ALGORITHM: 'aes-256-gcm',
    CRYPT__LENGTH__BYTES: 16,
    CRYPT__LENGTH__KEY: 32,
    CRYPT__ENCODING: 'hex',
    PATH__CONFIG: `${DATA_PATH}/config.json`,
    PATH__DATA: DATA_PATH,
    //TOKEN:$CONST__MULTI_USER
    PATH__PUBLIC: `${ROOT_PATH}/public`,
    //TOKEN:^CONST__MULTI_USER
    PATH__USERS: `${DATA_PATH}/users.json`,
    //TOKEN:$CONST__MULTI_USER
    SERVER__PORT: +process.env.SERVER_PORT || 3000,
  });
}
//TOKEN:$CONST__SERVER

module.exports = constants;

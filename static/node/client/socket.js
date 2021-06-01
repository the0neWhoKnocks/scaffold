import logger from '../utils/logger';

const WS_URL = location.origin.replace(/^http(s)?/, 'ws$1');
const log = logger('socket');
let socket;
const socketAPI = {
  connected: false,
  disconnect() {
    socket.close();
  },
  emit(type, data = {}) {
    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify({ data, type }));
    }
    else if (!socketAPI.reconnectInProgress) {
      socketAPI.connected = false;
      reconnectSocket();
    }
  },
  listeners: {},
  off(type, cb) {
    for (let i = socketAPI.listeners[type].length - 1; i >= 0; i--) {
      const handler = socketAPI.listeners[type][i];
      if (handler === cb) {
        socketAPI.listeners[type].splice(i, 1);
      }
    }
  },
  on(type, cb) {
    if (!socketAPI.listeners[type]) socketAPI.listeners[type] = [];
    socketAPI.listeners[type].push(cb);
  },
  reconnectInProgress: false,
};

function reconnectSocket() {
  socketAPI.reconnectInProgress = true;
  log.warn('Connection lost, attempting reconnection');
  
  const MAX_RETRIES = 5;
  let attempt = 1;
  let int;
  
  function stopReconnection() {
    clearInterval(int);
    socketAPI.reconnectInProgress = false;
  }
  
  int = setInterval(() => {
    if (attempt <= MAX_RETRIES) {
      connectToSocket()
        .then(() => {
          log.info('Connection has been reestablished');
          stopReconnection();
        })
        .catch((err) => {
          log.error(err);
        });
      attempt += 1;
    }
    else {
      stopReconnection();
      log.error(`Lost connection to Server, and after ${MAX_RETRIES} attempts the connection could not be reestablished.`);
    }
  }, 3000);
}

export function connectToSocket() {
  return new Promise((resolve, reject) => {
    socket = new WebSocket(WS_URL);

    socket.onopen = function onWSOpen() {
      socket.onmessage = function onWSMsg({ data: msgData }) {
        const { data, type } = JSON.parse(msgData);
        
        log.debug(`Message from Server: "${ type }"`, data);
        
        if (socketAPI.listeners[type]) {
          socketAPI.listeners[type].forEach(cb => { cb(data); });
        }
      };
      
      log.info('Client Socket connected to Server');

      socketAPI.connected = true;
      resolve(socketAPI);
    };

    socket.onerror = function onWSError(ev) {
      let err = 'An unknown error has occurred with your WebSocket';

      if (
        !socketAPI.connected
        && ev.currentTarget.readyState === WebSocket.CLOSED
      ) err = `WebSocket error, could not connect to ${ WS_URL }`;
      
      log.error(err);
      reject(err);
    };
  });
}

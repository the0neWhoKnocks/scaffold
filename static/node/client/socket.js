import logger from '../utils/logger';

const log = logger('socket');

export function connectToSocket() {
  return new Promise((resolve, reject) => {
    const WS_URL = location.origin.replace(/^http(s)?/, 'ws$1');
    const socket = new WebSocket(WS_URL);
    const socketAPI = {
      connected: false,
      disconnect() {
        socket.close();
      },
      emit(type, data = {}) {
        socket.send(JSON.stringify({ data, type }));
      },
      listeners: {},
      off(type, cb) {
        for(let i = socketAPI.listeners[type].length - 1; i >= 0; i--) {
          const handler = socketAPI.listeners[type][i];
          if(handler === cb) {
            socketAPI.listeners[type].splice(i, 1);
          }
        }
      },
      on(type, cb) {
        if(!socketAPI.listeners[type]) socketAPI.listeners[type] = [];
        socketAPI.listeners[type].push(cb);
      },
    };

    socket.onopen = function onWSOpen() {
      socket.onmessage = function onWSMsg({ data: msgData }) {
        const { data, type } = JSON.parse(msgData);
        
        // console.log(`Message from Server: "${ type }"`, data);
        
        if(socketAPI.listeners[type]) {
          socketAPI.listeners[type].forEach(cb => { cb(data); });
        }
      };
      
      log('Client Socket connected to Server');

      socketAPI.connected = true;
      resolve(socketAPI);
    };

    socket.onerror = function onWSError(ev) {
      let err = 'An unknown error has occurred with your WebSocket';

      if(
        !socketAPI.connected
        && ev.currentTarget.readyState === WebSocket.CLOSED
      ) err = `WebSocket error, could not connect to ${ WS_URL }`;
      
      reject(err);
    };
  });
}

<script>
  import logger from '../utils/logger';
  //TOKEN:^APP__WEB_SOCKET
  import {
    WS__CLOSE_CODE__USER_REMOVED,
    WS__MSG__EXAMPLE,
  } from '../constants';
  import { connectToSocket } from './socket';
  //TOKEN:$APP__WEB_SOCKET
  
  const log = logger('app');
  //TOKEN:^APP__WEB_SOCKET
  let wsData = [];
  
  log.info('App starting');
  
  async function init() {
    let socketAPI;
    try {
      let logNdx = 1;
      socketAPI = await connectToSocket();
      socketAPI.on(WS__CLOSE_CODE__USER_REMOVED, () => {
        log.info('User disconnected');
      });
      
      socketAPI.on(WS__MSG__EXAMPLE, ({ msg }) => {
        wsData = [...wsData, msg];
      });
      let count = 0;
      const int = setInterval(() => {
        if (count === 5) clearInterval(int);
        else socketAPI.emit(WS__MSG__EXAMPLE, { d: Date.now() });
        count++;
      }, 1000);
      
      wsData = [...wsData, 'Connected to Server socket'];
    }
    catch(err) { log.error(err); }
  }
  
  init();
  //TOKEN:$APP__WEB_SOCKET
</script>

<div class="app">
  <div class="frame">
    Hello World
    <!--TOKEN:^APP__WEB_SOCKET -->
    <pre class="ws-data">{wsData.join('\n')}</pre>
    <!--TOKEN:$APP__WEB_SOCKET -->
  </div>
</div>

<style>
  .app {
    width: 100%;
    height: 100%;
    background: #333;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .frame {
    width: 30vw;
    padding: 1em;
    border-radius: 0.25em;
    background: linear-gradient(#ccc, #aaa);
  }
  /*TOKEN:^APP__WEB_SOCKET */
  .ws-data {
    height: 10em;
    color: #00e100;
    overflow: auto;
    padding: 0.25em 0.5em;
    margin-bottom: 0;
    background: #222;
    display: block;
  }
  /*TOKEN:$APP__WEB_SOCKET */
</style>

<script>
  //TOKEN:^APP__SERVER_INTERACTIONS
  import { afterUpdate } from 'svelte';
  //TOKEN:$APP__SERVER_INTERACTIONS
  import logger from '../utils/logger';
  //TOKEN:^APP__WEB_SOCKET
  import {
    WS__CLOSE_CODE__USER_REMOVED,
    WS__MSG__EXAMPLE,
  } from '../constants';
  import { connectToSocket } from './socket';
  //TOKEN:$APP__WEB_SOCKET
  
  const log = logger('app');
  //TOKEN:^APP__SERVER_INTERACTIONS
  let serverData = [];
  let serverDataRef;
  let updateScroll = false;
  //TOKEN:$APP__SERVER_INTERACTIONS
  //TOKEN:^APP__WEB_SOCKET
  let socketAPI;
  //TOKEN:$APP__WEB_SOCKET
  //TOKEN:^APP__API
  
  function callAPI() {
    fetch('/api')
      .then(resp => resp.json())
      .then(data => {
        serverData = [...serverData, `[API] ${JSON.stringify(data)}`];
      })
      .catch(err => {
        log.error(err);
        alert(err);
      });
  }
  //TOKEN:$APP__API
  //TOKEN:^APP__WEB_SOCKET
  
  function callSocket() {
    socketAPI.emit(WS__MSG__EXAMPLE, { d: Date.now() });
  }
  //TOKEN:$APP__WEB_SOCKET
  
  async function init() {
    log.info('App starting');
    //TOKEN:^APP__API
    
    callAPI();
    //TOKEN:$APP__API
    //TOKEN:^APP__WEB_SOCKET
    
    try {
      socketAPI = await connectToSocket();
      
      socketAPI.on(WS__CLOSE_CODE__USER_REMOVED, () => {
        log.info('User disconnected');
      });
      socketAPI.on(WS__MSG__EXAMPLE, ({ msg }) => {
        serverData = [...serverData, `[WS] ${msg}`];
      });
      
      serverData = [...serverData, '[WS] Connected to Web Socket'];
      callSocket();
    }
    catch(err) { log.error(err); }
    //TOKEN:$APP__WEB_SOCKET
  }
  //TOKEN:^APP__SERVER_INTERACTIONS
  
  $: serverData, updateScroll = true;
  afterUpdate(() => {
    if (updateScroll) {
      serverDataRef.scrollTop = serverDataRef.scrollHeight;
      updateScroll = false;
    }
  });
  //TOKEN:^APP__SERVER_INTERACTIONS
  
  init();
</script>

<div class="app">
  <div class="frame">
    Hello World
    <!--TOKEN:^APP__SERVER_INTERACTIONS -->
    <pre
      class="server-data"
      bind:this={serverDataRef}
    >{serverData.join('\n')}</pre>
    <nav>
      <!--TOKEN:^APP__API -->
      <button on:click={callAPI}>Trigger API</button>
      <!--TOKEN:$APP__API -->
      <!--TOKEN:^APP__WEB_SOCKET -->
      <button on:click={callSocket}>Trigger Socket</button>
      <!--TOKEN:$APP__WEB_SOCKET -->
    </nav>
    <!--TOKEN:$APP__SERVER_INTERACTIONS -->
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
    width: 80vw;
    text-align: center;
    padding: 1em;
    border-radius: 0.25em;
    background: linear-gradient(#ccc, #aaa);
  }
  /*TOKEN:^APP__SERVER_INTERACTIONS */
  
  .server-data {
    height: 10em;
    color: #00e100;
    text-align: left;
    overflow: auto;
    padding: 0.25em 0.5em;
    margin-bottom: 0;
    background: #222;
    display: block;
  }
  
  nav {
    margin-top: 1em;
    display: flex;
  }
  nav button {
    width: 100%;
  }
  /*TOKEN:$APP__SERVER_INTERACTIONS */
</style>

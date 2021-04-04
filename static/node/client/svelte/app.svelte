<script>
  import logger from '../utils/logger';
  import {
    WS__CLOSE_CODE__USER_REMOVED,
  } from '../constants';
  import { connectToSocket } from './socket';
  
  const log = logger('app');
  
  async function init() {
    let socketAPI;
    try {
      let logNdx = 1;
      socketAPI = await connectToSocket();
      socketAPI.on(WS__CLOSE_CODE__USER_REMOVED, () => {
        log('User disconnected');
      });
    }
    catch(err) { log(err); }
  }
  
  init();
</script>

<div>
  Hello World
</div>

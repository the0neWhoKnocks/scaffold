<script>
  //TOKEN:^APP__SERVER_INTERACTIONS
  import { afterUpdate, onMount } from 'svelte';
  //TOKEN:$APP__SERVER_INTERACTIONS
  import logger from '../../utils/logger';
  //TOKEN:^APP__HAS_CONSTANTS
  import {
    //TOKEN:^APP__MULTI_USER
    NAMESPACE__STORAGE__USER,
    //TOKEN:$APP__MULTI_USER
    //TOKEN:^APP__EXT_API
    ROUTE__API__EXT,
    //TOKEN:$APP__EXT_API
    //TOKEN:^APP__API
    ROUTE__API__HELLO,
    //TOKEN:$APP__API
    //TOKEN:^APP__WEB_SOCKET
    WS__CLOSE_CODE__USER_REMOVED,
    WS__MSG__CONNECTED_TO_SERVER,
    WS__MSG__EXAMPLE,
    //TOKEN:$APP__WEB_SOCKET
  } from '../../constants';
  //TOKEN:$APP__HAS_CONSTANTS
  //TOKEN:^APP__WEB_SOCKET
  import { connectToSocket } from '../socket';
  //TOKEN:$APP__WEB_SOCKET
  //TOKEN:^APP__MULTI_USER
  import {
    getStorageType,
    setStorage,
  } from '../utils/storage';
  import Icon, {
    ICON__ANGLE_DOWN,
    ICON__ANGLE_UP,
    ICON__USER,
  } from './Icon.svelte';
  import LoginDialog from './LoginDialog.svelte';
  import UserDataDialog from './UserDataDialog.svelte';
  import UserProfileDialog from './UserProfileDialog.svelte';
  //TOKEN:$APP__MULTI_USER
  
  const log = logger('app');
  //TOKEN:^APP__SERVER_INTERACTIONS
  let logsLength = 0;
  let serverData = [];
  let serverDataRef;
  //TOKEN:$APP__SERVER_INTERACTIONS
  //TOKEN:^APP__WEB_SOCKET
  let socketAPI;
  //TOKEN:$APP__WEB_SOCKET
  //TOKEN:^APP__MULTI_USER
  let loginOpened = false;
  let userStorageType;
  let mounted = false;
  let username;
  let userNavOpen = false;
  let userDataOpened = false;
  let userInfo;
  let userProfileOpened = false;
  //TOKEN:$APP__MULTI_USER
  //TOKEN:^APP__EXT_API
  let extAPIPending = false;
  //TOKEN:$APP__EXT_API
  //TOKEN:^APP__SERVER_INTERACTIONS
  
  function printMessage(prefix, msg) {
    serverData = [...serverData, `<div><span>${prefix}</span> ${msg}</div>`];
  }
  function clearLogs() {
    serverData = [];
  }
  //TOKEN:$APP__SERVER_INTERACTIONS
  //TOKEN:^APP__API
  
  function callAPI() {
    fetch(`${ROUTE__API__HELLO}?name=hal`)
      .then(resp => resp.json())
      .then(data => {
        printMessage('API', JSON.stringify(data));
      })
      .catch(err => {
        log.error(err);
        alert(err);
      });
  }
  //TOKEN:$APP__API
  //TOKEN:^APP__EXT_API
  
  function decodeHTMLEntities (str) {
    if (str && typeof str === 'string') {
      const element = document.createElement('div');
      // strip script/html tags
      str = str.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, '');
      str = str.replace(/<\/?\w(?:[^"'>]|"[^"]*"|'[^']*')*>/gmi, '');
      element.innerHTML = str;
      str = element.textContent;
      element.textContent = '';
    }

    return str;
  }
  function callExtAPI() {
    extAPIPending = true;
    
    fetch(`${ROUTE__API__EXT}`)
      .then(resp => resp.json())
      .then(({ answer, question }) => {      
        printMessage('EXT_API', `${decodeHTMLEntities(question)} | ${decodeHTMLEntities(answer)}`);
        extAPIPending = false;
      })
      .catch(err => {
        log.error(err);
        alert(err);
      });
  }
  //TOKEN:$APP__EXT_API
  //TOKEN:^APP__WEB_SOCKET
  
  function callSocket() {
    socketAPI.emit(WS__MSG__EXAMPLE, { d: Date.now() });
  }
  //TOKEN:$APP__WEB_SOCKET
  //TOKEN:^APP__MULTI_USER
  
  function openLogin() {
    loginOpened = true;
  }
  function closeLogin() {
    loginOpened = false;
    userStorageType = getStorageType(NAMESPACE__STORAGE__USER);
  }
  function handleLogin() {
    setUserInfo();
    closeLogin();
    printMessage('USER', 'logged in');
  }
  
  function logoutUser() {
    window[userStorageType].removeItem(NAMESPACE__STORAGE__USER);
    userStorageType = undefined;
    userNavOpen = false;
    printMessage('USER', 'logged out');
  }
  
  function setUserInfo() {
    userStorageType = getStorageType(NAMESPACE__STORAGE__USER);
    
    if (userStorageType) {
      userInfo = JSON.parse(window[userStorageType].getItem(NAMESPACE__STORAGE__USER));
      username = userInfo.username;
    }
  }
  
  function toggleUserNav() {
    userNavOpen = !userNavOpen;
  }
  
  function openUserData() {
    userDataOpened = true;
  }
  function closeUserData() {
    userDataOpened = false;
  }
  function handleUserDataUpdate() {
    closeUserData();
    printMessage('USER', 'data updated');
  }
  
  function openUserProfile() {
    userProfileOpened = true;
  }
  function closeUserProfile() {
    userProfileOpened = false;
  }
  function handleProfileUpdate(data) {
    const persistent = getStorageType(NAMESPACE__STORAGE__USER) === 'localStorage';
    setStorage({
      data,
      key: NAMESPACE__STORAGE__USER,
      persistent,
    });
    
    userInfo = data;
    username = data.username;
    
    closeUserProfile();
    
    printMessage('USER', `profile updated: ${JSON.stringify(data)}`);
  }
  
  $: if (userProfileOpened || userDataOpened) {
    userNavOpen = false;
  }
  //TOKEN:$APP__MULTI_USER
  //TOKEN:^APP__SERVER_INTERACTIONS
  
  afterUpdate(() => {
    if (logsLength !== serverData.length && serverDataRef) {
      serverDataRef.scrollTop = serverDataRef.scrollHeight;
    }
    logsLength = serverData.length;
  });
  
  onMount(/* TOKEN:#APP__ASYNC_MOUNT */() => {
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
      
      socketAPI.on(WS__MSG__CONNECTED_TO_SERVER, ({ id, msg }) => {
        printMessage('WS', `${msg} with socket id: "${id}"`);
      });
      
      socketAPI.on(WS__MSG__EXAMPLE, ({ msg }) => {
        printMessage('WS', msg);
      });
      
      printMessage('WS', 'Connected to Web Socket');
      callSocket();
    }
    catch (err) { log.error(err); }
    //TOKEN:$APP__WEB_SOCKET
    //TOKEN:^APP__MULTI_USER
    
    setUserInfo();
    
    mounted = true;
    //TOKEN:$APP__MULTI_USER
  });
  //TOKEN:^APP__SERVER_INTERACTIONS
</script>

<div class="app">
  <div class="frame">
    Hello World
    <!--TOKEN:^APP__SERVER_INTERACTIONS -->
    <div class="server-data">
      <nav class="server-data__nav">
        <button on:click={clearLogs}>Clear</button>
      </nav>
      <pre
        class="server-data__logs"
        bind:this={serverDataRef}
      >
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        {@html serverData.join('')}
      </pre>
    </div>
    <nav class="api-nav">
      <!--TOKEN:^APP__API -->
      <button on:click={callAPI}>Trigger API</button>
      <!--TOKEN:$APP__API -->
      <!--TOKEN:^APP__EXT_API -->
      <button
        class:pending={extAPIPending}
        on:click={callExtAPI}
      >Trigger Ext. API</button>
      <!--TOKEN:$APP__EXT_API -->
      <!--TOKEN:^APP__WEB_SOCKET -->
      <button on:click={callSocket}>Trigger Socket</button>
      <!--TOKEN:$APP__WEB_SOCKET -->
      <!--TOKEN:^APP__MULTI_USER -->
      {#if userStorageType}
        <div class="user-menu">
          <button on:click={toggleUserNav}>
            <Icon type={ICON__USER} />
            {username}
            {#if userNavOpen}
              <Icon type={ICON__ANGLE_DOWN} />
            {:else}
              <Icon type={ICON__ANGLE_UP} />
            {/if}
          </button>
          <nav class:open={userNavOpen}>
            <button on:click={openUserProfile}>Edit Profile</button>
            <button on:click={openUserData}>Set Data</button>
            <button on:click={logoutUser}>Logout</button>
          </nav>
        </div>
      {:else}
        <button on:click={openLogin} class:checking={!mounted}>Login</button>
      {/if}
      <!--TOKEN:$APP__MULTI_USER -->
    </nav>
    <!--TOKEN:$APP__SERVER_INTERACTIONS -->
  </div>
</div>
<!--TOKEN:^APP__MULTI_USER -->
<LoginDialog
  onClose={closeLogin}
  onSuccess={handleLogin}
  open={loginOpened}
/>
<UserDataDialog
  onClose={closeUserData}
  onError={closeUserData}
  onSuccess={handleUserDataUpdate}
  open={userDataOpened}
  {userInfo}
/>
<UserProfileDialog
  onClose={closeUserProfile}
  onError={closeUserProfile}
  onSuccess={handleProfileUpdate}
  open={userProfileOpened}
  {userInfo}
/>
<!--TOKEN:$APP__MULTI_USER -->

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
  /* TOKEN:^APP__SERVER_INTERACTIONS */
  
  .server-data__nav {
    padding: 6px;
    border-bottom: dashed 1px #666;
    background: #222;
    display: flex;
    justify-content: flex-end;
  }
  .server-data__nav button {
    color: #666;
    padding: 4px 14px;
    border: solid 1px;
    border-radius: 4px;
    background: transparent;
  }
  .server-data__nav button:hover {
    color: #ccc;
  }
  .server-data__logs {
    height: 10em;
    color: #00e100;
    text-align: left;
    white-space: pre-wrap;
    overflow: auto;
    padding: 0.25em 0.5em;
    padding-top: 0.5em;
    margin: 0;
    background: #222;
    display: block;
  }
  .server-data__logs :global(div) {
    margin-bottom: 6px;
  }
  .server-data__logs :global(span) {
    padding: 2px 8px;
    border: solid 1px;
    border-radius: 0.25em;
    background: transparent;
    display: inline-block;
  }
  
  .api-nav {
    margin-top: 1em;
    display: flex;
  }
  .api-nav > *,
  .api-nav button {
    width: 100%;
    position: relative;
  }
  .api-nav button {
    border: solid 1px;
  }
  /* TOKEN:^APP__EXT_API */
  .api-nav button.pending::before {
    content: '\231B';
    width: 100%;
    height: 100%;
    background: #efefef;
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 0;
    left: 0;
  }
  /* TOKEN:$APP__EXT_API */
  /* TOKEN:^APP__MULTI_USER */
  .api-nav button.checking {
    color: transparent;
  }
  
  .user-menu {
    margin-left: 0.25em;
    position: relative;
  }
  .user-menu > button {
    height: 100%;
    border-radius: 0.5em;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .user-menu > :global(button svg) {
    color: #000;
    font-size: 1.1em;
  }
  .user-menu nav {
    width: 100%;
    padding: 0.25em;
    margin: 0;
    flex-direction: column;
    position: absolute;
    bottom: 100%;
    opacity: 0;
    transform: translateY(20%);
    transition: opacity 200ms, transform 200ms;
    visibility: hidden;
  }
  .user-menu nav.open {
    opacity: 1;
    transform: translateY(0%);
    visibility: visible;
  }
  /* TOKEN:$APP__MULTI_USER */
  /* TOKEN:$APP__SERVER_INTERACTIONS */
</style>

<script>
  //TOKEN:^APP__SERVER_INTERACTIONS
  import { afterUpdate, onMount } from 'svelte';
  //TOKEN:$APP__SERVER_INTERACTIONS
  import logger from '../utils/logger';
  //TOKEN:^APP__HAS_CONSTANTS
  import {
    //TOKEN:^APP__MULTI_USER
    NAMESPACE__STORAGE__USER,
    //TOKEN:$APP__MULTI_USER
    //TOKEN:^APP__API
    ROUTE__API__HELLO,
    //TOKEN:$APP__API
    //TOKEN:^APP__WEB_SOCKET
    WS__CLOSE_CODE__USER_REMOVED,
    WS__MSG__EXAMPLE,
    //TOKEN:$APP__WEB_SOCKET
  } from '../constants';
  //TOKEN:$APP__HAS_CONSTANTS
  //TOKEN:^APP__MULTI_USER
  import Icon, {
    ICON__ANGLE_DOWN,
    ICON__ANGLE_UP,
    ICON__USER,
  } from './components/Icon.svelte';
  import LoginDialog from './components/LoginDialog.svelte';
  import UserDataDialog from './components/UserDataDialog.svelte';
  import UserProfileDialog from './components/UserProfileDialog.svelte';
  import {
    getStorageType,
    setStorage,
  } from './utils/storage';
  //TOKEN:$APP__MULTI_USER
  //TOKEN:^APP__WEB_SOCKET
  import { connectToSocket } from './socket';
  //TOKEN:$APP__WEB_SOCKET
  
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
  let loginCompOpened = false;
  let userStorageType;
  let mounted = false;
  let username;
  let userNavOpen = false;
  let userDataOpened = false;
  let userInfo;
  let userProfileOpened = false;
  //TOKEN:$APP__MULTI_USER
  //TOKEN:^APP__API
  
  function callAPI() {
    fetch(`${ROUTE__API__HELLO}?name=hal`)
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
  //TOKEN:^APP__MULTI_USER
  
  function openLogin() {
    loginCompOpened = true;
  }
  function closeLogin() {
    loginCompOpened = false;
    userStorageType = getStorageType(NAMESPACE__STORAGE__USER);
  }
  function handleLogin() {
    setUserInfo();
    closeLogin();
  }
  
  function logoutUser() {
    window[userStorageType].removeItem(NAMESPACE__STORAGE__USER);
    userStorageType = undefined;
    userNavOpen = false;
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
  }
  //TOKEN:$APP__MULTI_USER
  //TOKEN:^APP__SERVER_INTERACTIONS
  
  afterUpdate(() => {
    if (logsLength !== serverData.length && serverDataRef) {
      serverDataRef.scrollTop = serverDataRef.scrollHeight;
    }
    logsLength = serverData.length;
  });
  
  onMount(async () => {
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
  <!--TOKEN:^APP__MULTI_USER -->
  {#if loginCompOpened}
    <LoginDialog
      onClose={closeLogin}
      onSuccess={handleLogin}
    />
  {/if}
  {#if userDataOpened}
    <UserDataDialog
      onClose={closeUserData}
      onError={closeUserData}
      onSuccess={closeUserData}
      {userInfo}
    />
  {/if}
  {#if userProfileOpened}
    <UserProfileDialog
      onClose={closeUserProfile}
      onError={closeUserProfile}
      onSuccess={handleProfileUpdate}
      {userInfo}
    />
  {/if}
  <!--TOKEN:$APP__MULTI_USER -->
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
  /* TOKEN:^APP__SERVER_INTERACTIONS */
  
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
  nav > *,
  nav button {
    width: 100%;
  }
  nav button {
    border: solid 1px;
  }
  /* TOKEN:^APP__MULTI_USER */
  nav button.checking {
    color: transparent;
  }
  
  .user-menu {
    margin-left: 0.25em;
    position: relative;
  }
  .user-menu > button {
    border-radius: 0.5em;
    display: flex;
    justify-content: space-between;
  }
  :global(.user-menu > button svg) {
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

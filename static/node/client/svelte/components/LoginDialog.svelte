<script>
  import { onMount } from 'svelte';
  import {
    NAMESPACE__STORAGE__USER,
    ROUTE__API__USER_CREATE,
    ROUTE__API__USER_LOGIN,
  } from '../../constants';
  import postData from '../utils/postData';
  import {
    getStorageType,
    setStorage,
  } from '../utils/storage';
  import Dialog from './Dialog.svelte';
  import HRWithText from './HRWithText.svelte';
  import LabeledInput from './LabeledInput.svelte';
  
  export let onClose = undefined;
  export let onSuccess = undefined;
  let loginOpen = true;
  let createUserOpen = false;
  let loginFormRef;
  let rememberCredentialsRef;
  let createFormRef;
  let createPassword;
  let createPasswordConfirmed;
  let loginUsername;
  let loginPassword;
  let rememberCredentials = false;
  
  function handleLoginSubmit(ev) {
    ev.preventDefault();
    
    postData(loginFormRef.action, loginFormRef)
      .then((userData) => {
        setStorage({
          data: userData,
          key: NAMESPACE__STORAGE__USER,
          persistent: rememberCredentialsRef.checked,
        });
        
        onSuccess(userData);
      })
      .catch(({ message }) => { alert(message); });
  }
  
  function handleCloseClick() {
    if (onClose) onClose();
  }
  
  function handleCreateAccountClick() {
    loginOpen = false;
    createUserOpen = true;
  }
  
  function handleCancelCreateClick() {
    createUserOpen = false;
    loginOpen = true;
  }
  
  function handleCreateSubmit(ev) {
    ev.preventDefault();
    
    const data = new FormData(createFormRef);
    const password = data.get('password');
    const username = data.get('username');
    
    if (password === data.get('passwordConfirmed')) {
      postData(createFormRef.action, createFormRef)
        .then(() => {
          loginUsername = username;
          loginPassword = password;
          handleCancelCreateClick();
        })
        .catch(({ error }) => { alert(error); });
    }
    else {
      alert("Your passwords don't match");
    }
  }
  
  onMount(() => {
    const storageType = getStorageType(NAMESPACE__STORAGE__USER);
    
    if (storageType) {
      const { password, username } = JSON.parse(window[storageType].getItem(NAMESPACE__STORAGE__USER));
      loginUsername = username;
      loginPassword = password;
      
      if (storageType === 'localStorage') rememberCredentials = true;
    }
  });
</script>

{#if loginOpen}
  <Dialog onCloseClick={handleCloseClick}>
    <form
      action={ROUTE__API__USER_LOGIN}
      autocomplete='off'
      bind:this={loginFormRef}
      class="login-form"
      method="POST"
      on:submit={handleLoginSubmit}
      slot="dialogBody"
      spellcheck="false"
    >
      <HRWithText label="Log In" />
      <LabeledInput
        autoFocus
        label="Username"
        name="username"
        required
        value={loginUsername}
      />
      <LabeledInput
        label="Password"
        name="password"
        required
        type="password"
        value={loginPassword}
      />
      <label class="remember-me">
        <input
          type="checkbox"
          bind:checked={rememberCredentials}
          bind:this={rememberCredentialsRef}
        />
        Remember Me
      </label>
      <button value="login">Log In</button>
      <HRWithText label="or" />
      <button
        type="button"
        value="create"
        on:click={handleCreateAccountClick}
      >Create Account</button>
    </form>
  </Dialog>
{/if}
{#if createUserOpen}
  <Dialog onCloseClick={handleCloseClick}>
    <form
      action={ROUTE__API__USER_CREATE}
      autocomplete="off"
      bind:this={createFormRef}
      class="create-form"
      method="POST"
      on:submit={handleCreateSubmit}
      slot="dialogBody"
      spellcheck="false"
    >
      <HRWithText label="Create Account" />
      <LabeledInput
        autoFocus 
        label="Username"
        name="username"
        required
      />
      <LabeledInput
        label="Password"
        name="password"
        required
        type="password"
      />
      <LabeledInput
        label="Confirm Password"
        name="passwordConfirmed"
        required
        type="password"
      />
      <nav>
        <button
          on:click={handleCancelCreateClick}
          type="button"
          value="cancel"
        >Cancel</button>
        <button value="create">Create</button>
      </nav>
    </form>
  </Dialog>
{/if}

<style>
  form {
    padding: 1em;
  }
  
  .create-form nav {
    display: flex;
  }
  .create-form nav button:not(:first-of-type) {
    margin-left: 0.75em;
  }
  
  .remember-me {
    text-align: right;
    user-select: none;
    cursor: pointer;
    display: block;
  }
</style>

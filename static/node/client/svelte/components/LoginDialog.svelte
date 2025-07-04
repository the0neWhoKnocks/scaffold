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
  
  let {
    onClose,
    onSuccess,
    open = false,
  } = $props();
  let createFormRef = $state();
  let createUserOpen = $state(false);
  let loginFormRef = $state();
  let loginPassword = $state();
  let loginUsername = $state();
  let rememberCredentials = $state(false);
  let rememberCredentialsRef = $state();
  
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
    open = false;
    createUserOpen = false;
    
    if (onClose) onClose();
  }
  
  function handleCreateAccountClick() {
    open = false;
    createUserOpen = true;
  }
  
  function handleCancelCreateClick() {
    createUserOpen = false;
    open = true;
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

{#if open}
  <Dialog onCloseClick={handleCloseClick}>
    {#snippet dialogBodySnippet()}
      <form
        action={ROUTE__API__USER_LOGIN}
        autocomplete='off'
        bind:this={loginFormRef}
        class="login-form"
        method="POST"
        onsubmit={handleLoginSubmit}
        spellcheck="false"
      >
        <HRWithText class="for--top" label="Log In" />
        <LabeledInput
          autoFocus
          compact
          label="Username"
          name="username"
          required
          value={loginUsername}
        />
        <LabeledInput
          compact
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
          onclick={handleCreateAccountClick}
        >Create Account</button>
      </form>
    {/snippet}
  </Dialog>
{/if}
{#if createUserOpen}
  <Dialog onCloseClick={handleCloseClick}>
    {#snippet dialogBodySnippet()}
      <form
        action={ROUTE__API__USER_CREATE}
        autocomplete="off"
        bind:this={createFormRef}
        class="create-form"
        method="POST"
        onsubmit={handleCreateSubmit}
        spellcheck="false"
      >
        <HRWithText class="for--top" label="Create Account" />
        <LabeledInput
          autoFocus 
          compact
          label="Username"
          name="username"
          required
        />
        <LabeledInput
          compact
          label="Password"
          name="password"
          required
          type="password"
        />
        <LabeledInput
          compact
          label="Confirm Password"
          name="passwordConfirmed"
          required
          type="password"
        />
        <nav>
          <button
            onclick={handleCancelCreateClick}
            type="button"
            value="cancel"
          >Cancel</button>
          <button value="create">Create</button>
        </nav>
      </form>
    {/snippet}
  </Dialog>
{/if}

<style>
  form {
    padding: 1em;
    overflow-y: auto;
  }
  
  :global(.hr-with-text.for--top) {
    margin-bottom: -0.25em; /* offset for the first input's animated placeholder */
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

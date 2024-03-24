<script>
  import {
    ROUTE__API__USER_GET_PROFILE,
    ROUTE__API__USER_SET_PROFILE,
  } from '../../constants';
  import postData from '../utils/postData';
  import Dialog from './Dialog.svelte';
  import LabeledInput from './LabeledInput.svelte';
  
  export let onClose = undefined;
  export let onError = undefined;
  export let onSuccess = undefined;
  export let open = false;
  export let userInfo = undefined;
  let dataLoaded = false;
  let dataUpdated = false;
  let formRef;
  let initialFormData;
  let inputRef;
  let oldPassword = '';
  let oldUsername = '';
  let password = '';
  let username = '';

  function handleSubmit() {
    postData(formRef.action, formRef)
      .then((data) => {
        if (onSuccess) onSuccess(data);
      })
      .catch(({ message }) => { alert(message); });
  }
  
  function getUserProfile() {
    postData(ROUTE__API__USER_GET_PROFILE, userInfo)
      .then((profileData) => {
        oldPassword = profileData.password;
        oldUsername = profileData.username;
        password = profileData.password;
        username = profileData.username;
        dataLoaded = true;
      })
      .catch(({ message }) => {
        if (onError) onError();
        alert(message);
      });
  }
  
  function handleCloseClick() {
    if (onClose) onClose();
  }
  
  function handleChange() {
    dataUpdated = initialFormData !== [...new FormData(formRef).values()].join('');
  }
  
  $: if (dataLoaded && inputRef) inputRef.focus();
  
  $: if (formRef && dataLoaded) {
    initialFormData = [...new FormData(formRef).values()].join('');
  }
  
  $: if (open) { getUserProfile(); }
  else {
    dataLoaded = false;
    dataUpdated = false;
  }
</script>

{#if dataLoaded}
  <Dialog
    onCloseClick={handleCloseClick}
    title="User Profile"
  >
    <form
      action={ROUTE__API__USER_SET_PROFILE}
      bind:this={formRef}
      class="user-profile-form"
      method="POST"
      on:input={handleChange}
      on:submit|preventDefault={handleSubmit}
      slot="dialogBody"
    >
      <input type="hidden" name="oldPassword" value={oldPassword} />
      <input type="hidden" name="oldUsername" value={oldUsername} />
      <LabeledInput label="Username" name="username" value={username} autoFocus compact required />
      <LabeledInput label="Password" name="password" value={password} compact required />
      <nav>
        <button disabled={!dataUpdated}>Update</button>
      </nav>
    </form>
  </Dialog>
{/if}

<style>
  .user-profile-form {
    padding: 1em;
  }
  .user-profile-form nav {
    margin: 0;
  }
  .user-profile-form button:disabled {
    opacity: 0.5;
    cursor: default;
  }
</style>

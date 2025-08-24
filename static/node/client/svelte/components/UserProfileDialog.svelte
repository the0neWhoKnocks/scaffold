<script>
  import {
    ROUTE__API__USER_GET_PROFILE,
    ROUTE__API__USER_SET_PROFILE,
  } from '../../constants';
  import postData from '../utils/postData';
  import Dialog from './Dialog.svelte';
  import LabeledInput from './LabeledInput.svelte';
  
  let {
    onClose,
    onError,
    onSuccess,
    open = false,
    userInfo,
  } = $props();
  let dataLoaded = $state.raw(false);
  let dataUpdated = $state.raw(false);
  let formRef = $state();
  let initialFormData;
  let oldPassword = $state.raw('');
  let oldUsername = $state.raw('');
  let password = $state.raw('');
  let username = $state.raw('');

  function handleSubmit(ev) {
    ev.preventDefault();
    
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
  
  $effect(() => {
    if (formRef && dataLoaded) {
      initialFormData = [...new FormData(formRef).values()].join('');
    }
    
    if (open) { getUserProfile(); }
    else {
      dataLoaded = false;
      dataUpdated = false;
    }
  });
</script>

{#if dataLoaded}
  <Dialog
    onCloseClick={handleCloseClick}
    title="User Profile"
  >
    {#snippet dialogBodySnippet()}
      <form
        action={ROUTE__API__USER_SET_PROFILE}
        bind:this={formRef}
        class="user-profile-form"
        method="POST"
        oninput={handleChange}
        onsubmit={handleSubmit}
      >
        <input type="hidden" name="oldPassword" value={oldPassword} />
        <input type="hidden" name="oldUsername" value={oldUsername} />
        <LabeledInput label="Username" name="username" value={username} autoFocus compact required />
        <LabeledInput label="Password" name="password" value={password} compact required />
        <nav>
          <button disabled={!dataUpdated}>Update</button>
        </nav>
      </form>
    {/snippet}
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

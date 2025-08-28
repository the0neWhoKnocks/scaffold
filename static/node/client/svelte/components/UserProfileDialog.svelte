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

  async function handleSubmit(ev) {
    ev.preventDefault();
    
    try {
      const data = await postData(formRef.action, formRef);
      onSuccess?.(data);
    }
    catch ({ message }) { alert(message); }
  }
  
  async function getUserProfile() {
    try {
      const profileData = await postData(ROUTE__API__USER_GET_PROFILE, userInfo);
      oldPassword = profileData.password;
      oldUsername = profileData.username;
      password = profileData.password;
      username = profileData.username;
      dataLoaded = true;
    }
    catch ({ message }) {
      onError?.();
      alert(message);
    }
  }
  
  function handleCloseClick() {
    onClose?.();
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
    {#snippet s_dialogBody()}
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

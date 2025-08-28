<script>
  import {
    ROUTE__API__USER_GET_DATA,
    ROUTE__API__USER_SET_DATA,
  } from '../../constants';
  import postData from '../utils/postData';
  import Dialog from './Dialog.svelte';
  
  let {
    onClose,
    onError,
    onSuccess,
    open = false,
    userInfo,
  } = $props();
  let data = $state.raw();
  let dataLoaded = $state.raw(false);
  let formRef = $state();
  let inputRef = $state();

  async function handleSubmit(ev) {
    ev.preventDefault();
    
    try {
      const data = await postData(formRef.action, formRef);
      onSuccess?.(data);
    }
    catch ({ message }) { alert(message); }
  }
  
  async function getUserData() {
    try {
      const resp = await postData(ROUTE__API__USER_GET_DATA, userInfo);
      data = resp.data;
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
  
  $effect(() => {
    if (dataLoaded && inputRef) inputRef.focus();
    
    if (open) { getUserData(); }
    else { dataLoaded = false; }
  });
</script>

{#if dataLoaded}
  <Dialog
    onCloseClick={handleCloseClick}
    title="User Data"
  >
    {#snippet s_dialogBody()}
      <form
        action={ROUTE__API__USER_SET_DATA}
        bind:this={formRef}
        class="user-data-form"
        method="POST"
        onsubmit={handleSubmit}
      >
        <input type="hidden" name="password" value={userInfo.password} />
        <input type="hidden" name="username" value={userInfo.username} />
        <textarea
          bind:this={inputRef}
          bind:value={data}
          name="data"
          placeholder="Enter some data"
        ></textarea>
        <nav>
          <button>Save</button>
        </nav>
      </form>
    {/snippet}
  </Dialog>
{/if}

<style>
  .user-data-form {
    padding: 1em;
  }
  .user-data-form textarea {
    min-width: 30em;
    min-height: 12em;
    padding: 1em;
  }
  .user-data-form nav {
    margin: 0;
  }
</style>

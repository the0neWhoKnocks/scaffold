<script>
  import {
    ROUTE__API__CONFIG_CREATE,
  } from '../../constants';
  import postData from '../utils/postData';
  import Dialog from './Dialog.svelte';
  import HRWithText from './HRWithText.svelte';
  import LabeledInput from './LabeledInput.svelte';
  
  let formRef;
  
  function handleSubmit(ev) {
    ev.preventDefault();
    
    postData(formRef.action, formRef)
      .then(() => { window.location.reload(); })
      .catch((err) => { alert(err); });
  }
</script>

<div class="config">
  <Dialog modal>
    {#snippet dialogBodySnippet()}
      <form
        action={ROUTE__API__CONFIG_CREATE}
        autocomplete="off"
        bind:this={formRef}
        onsubmit={handleSubmit}
        method="POST"
      >
        <HRWithText label="Create Config" />
        <p>
          Looks like this is your first time running this App, so let's set
          some things up.
        </p>
        <LabeledInput
          autoFocus
          helpText="The Cipher Key is a unique value used for some top-level encryption operations of the App."
          label="Cipher Key"
          name="cipherKey"
          placeholder="word or phrase"
          required
        />
        <LabeledInput
          helpText="The Salt is a unique value that will be used to randomize encrypted values."
          label="Salt"
          name="salt"
          placeholder="word or phrase"
          required
        />
        <button value="create">Create</button>
      </form>
    {/snippet}
  </Dialog>
</div>

<style>
  .config {
    width: 100%;
    height: 100%;
    background: #333;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  form {
    max-width: 360px;
    padding: 1em;
  }
</style>

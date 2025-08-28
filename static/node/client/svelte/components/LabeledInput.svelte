<script>
  import { onMount, tick } from 'svelte';
  import Icon, { ICON__ASTERISK } from './Icon.svelte';
  
  let {
    autoComplete = false,
    autoFocus = false,
    children,
    class: className = '',
    compact = false,
    disabled = false,
    helpText = '',
    hiddenValue = '',
    label = '',
    name = '',
    placeholder = ' ', // empty space required for `placeholder-shown` selector
    required,
    type = 'text',
    value = '',
  } = $props();
  
  const id = btoa(`cli_${name}`).replace(/=/g, '');
  let inputRef;
  
  if (autoFocus) {
    onMount(async () => {
      await tick();
      inputRef.focus();
    });
  }
</script>

<div
  class="labeled-input {className}"
  class:is--compact={compact}
>
  <div class="labeled-input__wrapper">
    {#if hiddenValue}
      <input type="hidden" name="{name}_hidden" value="{hiddenValue}" />
    {/if}
    <label for="{id}">{label}</label>
    <input
      autocomplete={autoComplete ? 'on' : 'off'}
      bind:this={inputRef}
      {id}
      {disabled}
      {name}
      {placeholder}
      {required}
      {type}
      {value}
    />
    {#if required}
      <Icon type={ICON__ASTERISK} />
    {/if}
  </div>
  {#if helpText}
    <p class="help-text">{helpText}</p>
  {/if}
  {@render children?.()}
</div>

<style>
  .labeled-input__wrapper {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5em;
    position: relative;
  }
  
  .labeled-input input {
    width: var(--labeled-input__input-width, 100%);
    padding: 0.5em;
  }
  .labeled-input input:required {
    padding: 0.5em 1.75em 0.5em 0.5em;
  }
  .labeled-input input:required ~ :global(svg) {
    color: #ff7600;
    font-size: 1em;
    position: absolute;
    top: 50%;
    right: 0.5em;
    transform: translateY(-50%);
  }
  
  .labeled-input.is--compact {
    margin-top: 1.25em;
  }
  .labeled-input.is--compact label {
    user-select: none;
    position: absolute;
    top: 50%;
    left: 0.5em;
    transform-origin: left center;
    transform: translateY(-50%) scale(1);
    opacity: 0.5;
    transition: transform 300ms;
    transition-delay: 100ms; /* adding delay so the animations don't overlay if transitioning to another element (basically if one dialog fades to another, this animation was executing causing a slight visual jank) */
  }
  .labeled-input.is--compact label:has(+ input:focus),
  .labeled-input.is--compact label:has(+ input:not(:placeholder-shown)) {
    transform: translateY(-170%) scale(0.8);
    transition-delay: 0ms;
  }
  
  .help-text {
    color: rgba(0 ,0, 0, 0.5);
    font-size: 0.75em;
    margin: 0.5em 0;
  }
</style>

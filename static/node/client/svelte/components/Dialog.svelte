<script>
  import { cubicOut } from 'svelte/easing'; // visualizations https://svelte.dev/repl/6904f0306d6f4985b55f5f9673f762ef?version=3.4.1
  
  export let animDuration = 300;
  export let bodyColor = '#eee';
  export let borderColor = '#000';
  export let modal = false;
  export let onCloseClick = undefined;
  export let onCloseEnd = undefined;
  export let title = '';
  export let titleBGColor = '#333';
  export let titleTextColor = '#eee';
  
  const cssVars = `
    --dialog-anim-duration: ${animDuration}ms;
    --dialog-border-color: ${borderColor};
    --dialog-body-color: ${bodyColor};
    --dialog-title-bg-color: ${titleBGColor};
    --dialog-title-text-color: ${titleTextColor};
  `;
  
  const toggleDialog = (node, { dir, start }) => {
    const diff = 20;
    return {
      duration: animDuration,
      css: t => {
        const eq = dir === 'in'
          ? start - (t * diff)
          : start - (diff - (t * diff));
        
        return `
          transform: translate(-50%, -${eq}%);
          opacity: ${t};
        `;
      },
      easing: cubicOut,
    };
  };
  
  const toggleMask = () => ({
    duration: animDuration,
    css: t => `opacity: ${t};`,
    easing: cubicOut,
	});
  
  function handleCloseEnd() {
    if (onCloseEnd) onCloseEnd();
  }
  
  function handleCloseClick() {
    if (!modal && onCloseClick) onCloseClick();
  }
  
  function handleKeyDown({ key }) {
    switch (key) {
      case 'Escape':
        handleCloseClick();
        break;
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown}/>

<div 
  class="dialog-wrapper"
  style={cssVars}
>
  <div
    class="dialog-mask"
    aria-hidden="true"
    on:click={handleCloseClick}
    in:toggleMask
    out:toggleMask
  ></div>
  <dialog
    class="dialog"
    class:is--modal={modal}
    open
    in:toggleDialog="{{ dir: 'in', start: 70 }}"
    out:toggleDialog="{{ start: 50 }}"
    on:outroend={handleCloseEnd}
  >
    {#if !modal || modal && title}
      <nav class="dialog__nav">
        <div class="dialog__title">
          <slot name="dialogTitle">{title}</slot>
        </div>
        {#if !modal}
          <button
            type="button"
            class="dialog__close-btn"
            on:click={handleCloseClick}
          >&#10005;</button>
        {/if}
      </nav>
    {/if}
    <div class="dialog__body">
      <slot name="dialogBody"></slot>
    </div>
  </dialog>
</div>

<style>
  .dialog-wrapper {
    font: 16px Helvetica, Arial, sans-serif;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    z-index: 10;
  }
  .dialog-wrapper *,
  .dialog-wrapper *::after,
  .dialog-wrapper *::before {
    box-sizing: border-box;
  }
  
  .dialog-wrapper :global(button),
  .dialog-wrapper :global(input),
  .dialog-wrapper :global(select),
  .dialog-wrapper :global(textarea) {
		fill: orange;
	}
  .dialog-wrapper :global(button:not(disabled)) {
    cursor: pointer;
  }
  .dialog__body :global(button) {
    color: #fff;
    width: 100%;
    padding: 0.75em 1em;
    border: none;
    border-radius: 0.25em;
    background: #000;
    position: relative;
  }
  .dialog__body :global(button:focus) {
    outline: none;
  }
  .dialog__body :global(button:focus::after) {
    content: '';
    position: absolute;
    border: solid 2px currentColor;
    border-radius: 0.25em;
    top: 2px;
    left: 2px;
    bottom: 2px;
    right: 2px;
  }
  
  .dialog {
    overflow: hidden;
    padding: 0;
    border: solid 4px var(--dialog-border-color);
    border-radius: 0.5em;
    margin: 0;
    background: var(--dialog-border-color);
    box-shadow: 0 0.75em 2em 0.25em rgba(0, 0, 0, 0.75);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
  
  .dialog__nav {
    min-height: 2em;
    font-size: 1.25em;
    border-bottom: solid 1px;
    background-color: var(--dialog-title-bg-color);
    display: flex;
  }
  
  .dialog__title {
    width: 100%;
    color: var(--dialog-title-text-color);
    padding: 0.5em;
    padding-right: 1em;
    background: var(--dialog-title-bg-color);
  }
  
  .dialog__body {
    background: var(--dialog-body-color);
  }
  
  .dialog__close-btn {
    color: var(--dialog-title-text-color);
    padding: 0 1em;
    border: none;
    background: var(--dialog-title-bg-color);
  }
  .is--modal .dialog__close-btn {
    display: none;
  }
  
  .dialog-mask {
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.5);
    position: absolute;
    top: 0;
    left: 0;
    backdrop-filter: blur(10px);
  }
</style>

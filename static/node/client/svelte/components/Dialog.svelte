<script module>
  let dialogNum = 0;
</script>
<script>
  import { cubicOut } from 'svelte/easing'; // visualizations https://svelte.dev/repl/6904f0306d6f4985b55f5f9673f762ef?version=3.4.1
  import Portal from 'svelte-portal';
  
  let {
    animDuration = 300,
    bodyColor = '#eee',
    borderColor = '#000',
    dialogBodySnippet,
    dialogTitleSnippet,
    modal = false,
    onCloseClick,
    onCloseEnd,
    onOpenEnd,
    title = '',
    titleBGColor = '#333',
    titleTextColor = '#eee',
  } = $props();
  
  dialogNum += 1;
  let dNum = dialogNum;
  
  const cssVars = `
    --dialog-anim-duration: ${animDuration}ms;
    --dialog-border-color: ${borderColor};
    --dialog-body-color: ${bodyColor};
    --dialog-title-bg-color: ${titleBGColor};
    --dialog-title-text-color: ${titleTextColor};
  `;
  
  const toggleDialog = (_, { dir, start }) => {
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
    dialogNum -= 1;
  }
  
  function handleOpenEnd() {
    if (onOpenEnd) onOpenEnd();
  }
  
  function handleCloseClick() {
    if (!modal && onCloseClick) onCloseClick();
  }
  
  function handleKeyDown({ key }) {
    switch (key) {
      case 'Escape': {
        if (dNum === dialogNum) handleCloseClick();
        break;
      }
    }
  }
</script>

<svelte:window onkeydown={handleKeyDown}/>

<Portal target="#overlays">
  <div 
    class="dialog-wrapper"
    style={cssVars}
  >
    <div
      class="dialog-mask"
      aria-hidden="true"
      onclick={handleCloseClick}
      in:toggleMask
      out:toggleMask
    ></div>
    <dialog
      class="dialog"
      class:is--modal={modal}
      open
      in:toggleDialog="{{ dir: 'in', start: 70 }}"
      out:toggleDialog="{{ start: 50 }}"
      onintroend={handleOpenEnd}
      onoutroend={handleCloseEnd}
    >
      {#if !modal || modal && (title || dialogTitleSnippet)}
        <nav class="dialog__nav">
          <div class="dialog__title">
            {#if dialogTitleSnippet}
              {@render dialogTitleSnippet?.()}
            {:else}
              {title}
            {/if}
          </div>
          {#if !modal}
            <button
              type="button"
              class="dialog__close-btn"
              onclick={handleCloseClick}
            >&#10005;</button>
          {/if}
        </nav>
      {/if}
      <div class="dialog__body">
        {@render dialogBodySnippet?.()}
      </div>
    </dialog>
  </div>
</Portal>

<style>
  .dialog-wrapper {
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
  .dialog-wrapper :global(button:not(:disabled)) {
    cursor: pointer;
  }
  
  .dialog {
    max-width: calc(100vw - 4em); /* edge spacing in case content is large */
    max-height: calc(100vh - 4em);
    overflow: hidden;
    padding: 0;
    border: solid 4px var(--dialog-border-color);
    border-radius: 0.5em;
    margin: 0;
    background: var(--dialog-border-color);
    box-shadow: 0 0.75em 2em 0.25em rgba(0, 0, 0, 0.75);
    display: flex;
    flex-direction: column;
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
    align-items: center;
  }
  
  .dialog__title {
    width: 100%;
    color: var(--dialog-title-text-color);
    padding: 0.5em;
    padding-right: 1em;
    background: var(--dialog-title-bg-color);
  }
  
  .dialog__body {
    overflow: hidden;
    background: var(--dialog-body-color);
    display: flex;
  }
  
  .dialog__close-btn {
    color: var(--dialog-title-text-color);
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

<script>
  let {
    class: className = '',
    label = '',
  } = $props();
</script>

<div class="hr-with-text {className}">
  <span>{label}</span>
</div>

<style>
  .hr-with-text {
    font-weight: bold;
    text-align: center;
    position: relative;
    z-index: 0;
  }
  .hr-with-text::before {
    content: '';
    width: 100%;
    height: 1px;
    background: currentColor;
    position: absolute;
    top: 50%;
    left: 0;
    z-index: -1;
  }
  .hr-with-text > * {
    padding: 0 1em;
    background: #eeeeee;
  }
</style>

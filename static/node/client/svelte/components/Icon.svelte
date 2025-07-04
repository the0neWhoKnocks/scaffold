<script module>
  export const ICON__ANGLE_DOWN = 'angle-down';
  export const ICON__ANGLE_UP = 'angle-up';
  export const ICON__ASTERISK = 'asterisk';
  export const ICON__USER = 'user';
</script>
<script>
  let { type } = $props();
</script>

<svg class="svg-icon">
  <use xlink:href="#{type}" xmlns:xlink="http://www.w3.org/1999/xlink"></use>
</svg>

<style>
  .svg-icon {
    width: 1em;
    height: 1em;
    fill: currentColor;
  }
</style>
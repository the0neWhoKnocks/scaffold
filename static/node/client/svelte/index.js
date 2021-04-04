import { DOM__SVELTE_MOUNT_POINT } from '../constants';
import App from './app.svelte';

new App({
  target: document.getElementById(DOM__SVELTE_MOUNT_POINT),
  props: {},
});

document.body.classList.add('view-loaded');

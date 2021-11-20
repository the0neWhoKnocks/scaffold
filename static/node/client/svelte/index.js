import { DOM__SVELTE_MOUNT_POINT } from '../constants';
import App from './components/App.svelte';
//TOKEN:^CLIENT__MULTI_USER
import ConfigDialog from './components/ConfigDialog.svelte';
//TOKEN:$CLIENT__MULTI_USER

const props = {
  target: document.getElementById(DOM__SVELTE_MOUNT_POINT),
  props: window.app.props,
};
//TOKEN:^CLIENT__NO_MULTI_USER
new App(props);
//TOKEN:$CLIENT__NO_MULTI_USER
//TOKEN:^CLIENT__MULTI_USER
if (window.app.props.configExists) new App(props);
else new ConfigDialog(props);
//TOKEN:$CLIENT__MULTI_USER

document.body.classList.add('view-loaded');

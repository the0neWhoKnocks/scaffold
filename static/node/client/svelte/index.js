import { DOM__SVELTE_MOUNT_POINT } from '../constants';
import App from './components/App.svelte';
//TOKEN:^CLIENT__MULTI_USER
import ConfigDialog from './components/ConfigDialog.svelte';
//TOKEN:$CLIENT__MULTI_USER

const { configExists, ...winProps } = window.app.props;
const props = {
  target: document.getElementById(DOM__SVELTE_MOUNT_POINT),
  props: winProps,
};
//TOKEN:^CLIENT__NO_MULTI_USER
new App(props);
//TOKEN:$CLIENT__NO_MULTI_USER
//TOKEN:^CLIENT__MULTI_USER

if (configExists) new App(props);
else new ConfigDialog(props);
//TOKEN:$CLIENT__MULTI_USER

document.body.classList.add('view-loaded');

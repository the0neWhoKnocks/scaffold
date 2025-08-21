import {
  APP__TITLE,
  //TOKEN:^TEST__MULTI_USER
  ROUTE__API__USER_CREATE,
  ROUTE__API__USER_LOGIN,
  ROUTE__API__USER_SET_DATA,
  ROUTE__API__USER_SET_PROFILE,
  //TOKEN:$TEST__MULTI_USER
} from '@src/constants';  // eslint-disable-line n/no-missing-import
import {
  LOG_TYPE__REQUEST,
  //TOKEN:^TEST__WEB_SOCKETS
  LOG_TYPE__WEBSOCKET,
  //TOKEN:$TEST__WEB_SOCKETS
  //TOKEN:^TEST__STATIC_UTILS
  AppFixture,
  //TOKEN:$TEST__STATIC_UTILS
  expect,
  test,
} from './fixtures/AppFixture';
//TOKEN:^TEST__STATIC_UTILS

const {
  //TOKEN:^TEST__PROXY
  clearProxyState,
  //TOKEN:$TEST__PROXY
  //TOKEN:^TEST__MULTI_USER
  exec,
  //TOKEN:$TEST__MULTI_USER
  //TOKEN:^TEST__PROXY
  setProxyState,
  //TOKEN:$TEST__PROXY
} = AppFixture;
//TOKEN:$TEST__STATIC_UTILS

test.describe.configure({ mode: 'serial' }); // Required to stop tests on failure.

test('App', async ({ app }) => {
  //TOKEN:^TEST__MULTI_USER
  await exec('rm -rf /app_data/*');
  
  //TOKEN:$TEST__MULTI_USER
  await app.loadPage();
  
  await test.step('should have the correct title', async () => {
    await expect(app.page).toHaveTitle(APP__TITLE);
  });
  //TOKEN:^TEST__MULTI_USER

  await test.step('should fill out App config', async () => {
    await app.inputAdminConfig('temp', 'pepper');
  });
  //TOKEN:$TEST__MULTI_USER
  //TOKEN:^TEST__API
    
  await test.step('should make a request to the simple API', async () => {
    await app.clearLogs();
    const resp = await app.triggerAPI();
    await app.verifyLogMsgs({
      msgs: [`API ${JSON.stringify(resp)}`],
      screenshot: { label: 'API triggered', loc: '.server-data__logs' },
      type: LOG_TYPE__REQUEST,
    });
  });
  //TOKEN:$TEST__API
  //TOKEN:^TEST__EXT_API
  
  await test.step('should make a request to an external API', async () => {
    await app.clearLogs();
    const resp = await app.triggerExtAPI();
    await app.verifyLogMsgs({
      msgs: [`EXT_API ${resp.question} | ${resp.answer}`],
      type: LOG_TYPE__REQUEST,
    });
    //TOKEN:^TEST__PROXY
    
    const q = "I'm a mocked trivia question!";
    const a = 'True';
    await setProxyState({ mockData: [{ question: q, correct_answer: a }] });
    await app.clearLogs();
    await app.triggerExtAPI();
    await app.verifyLogMsgs({
      msgs: [`EXT_API ${q} | ${a}`],
      type: LOG_TYPE__REQUEST,
    });
    await clearProxyState();
    //TOKEN:$TEST__PROXY
    
    await app.screenshot('ext API triggered', '.server-data__logs');
  });
  //TOKEN:$TEST__EXT_API
  //TOKEN:^TEST__WEB_SOCKETS
  
  await test.step('should trigger the WebSocket', async () => {
    await app.clearLogs();
    const msg = await app.triggerSocket();
    await app.verifyLogMsgs({
      msgs: [msg],
      screenshot: { label: 'Socket triggered', loc: '.server-data__logs' },
      type: LOG_TYPE__WEBSOCKET,
    });
  });
  //TOKEN:$TEST__WEB_SOCKETS
  //TOKEN:^TEST__MULTI_USER

  await test.step('should execute User actions', async () => {
    const SELECTOR__CREATE_FORM = '.create-form';
    const SELECTOR__LOGIN_FORM = '.login-form';
    const SELECTOR__USER_MENU = '.user-menu';
    const SELECTOR__USER_DATA_FORM = '.user-data-form';
    const SELECTOR__USER_PROFILE_FORM = '.user-profile-form';
    
    await app.getEl('.api-nav').getByRole('button', { name: 'Login' }).click();
    await app.screenshot('Login clicked');
    
    let loginFormEl = app.getEl(SELECTOR__LOGIN_FORM);
    await loginFormEl.getByRole('button', { name: 'Create Account' }).click();
    await app.screenshot('Create Account open');
    
    const USERNAME = 'user';
    const PASSWORD = 'pass';
    const createUserResp = app.waitForResp('POST', ROUTE__API__USER_CREATE);
    const createFormEl = app.getEl(SELECTOR__CREATE_FORM);
    await createFormEl.locator('input[name="username"]').fill(USERNAME);
    await createFormEl.locator('input[name="password"]').fill(PASSWORD);
    await createFormEl.locator('input[name="passwordConfirmed"]').fill(PASSWORD);
    await createFormEl.getByRole('button', { name: 'Create' }).click();
    await createUserResp;
    loginFormEl = app.getEl(SELECTOR__LOGIN_FORM);
    await expect(loginFormEl.locator('input[name="username"]')).toHaveValue(USERNAME);
    await expect(loginFormEl.locator('input[name="password"]')).toHaveValue(PASSWORD);
    await app.screenshot('User created');
    
    const loginResp = app.waitForResp('POST', ROUTE__API__USER_LOGIN);
    await loginFormEl.getByRole('button', { name: 'Log In' }).click();
    await loginResp;
    await expect(loginFormEl).toHaveCount(0);
    await app.screenshot('User logged in');
    
    const userMenu = app.getEl(SELECTOR__USER_MENU);
    await userMenu.getByRole('button', { name: USERNAME }).click();
    await app.screenshot('User menu open');
    
    let setProfileResp = app.waitForResp('POST', ROUTE__API__USER_SET_PROFILE);
    await userMenu.locator('nav').getByRole('button', { name: 'Edit Profile' }).click();
    let profileForm = app.getEl(SELECTOR__USER_PROFILE_FORM);
    await profileForm.locator('input[name="username"]').fill('user1');
    await app.screenshot('User name changed');
    await profileForm.getByRole('button', { name: 'Update' }).click();
    await setProfileResp;
    await expect(profileForm).toHaveCount(0);
    await app.screenshot('User name updated');
    
    const setDataResp = app.waitForResp('POST', ROUTE__API__USER_SET_DATA);
    await userMenu.getByRole('button', { name: 'user1' }).click();
    await userMenu.locator('nav').getByRole('button', { name: 'Set Data' }).click();
    const dataForm = app.getEl(SELECTOR__USER_DATA_FORM);
    await dataForm.locator('textarea').fill('random user data');
    await app.screenshot('User data entered');
    await dataForm.getByRole('button', { name: 'Save' }).click();
    await setDataResp;
    await expect(dataForm).toHaveCount(0);
    await app.screenshot('User data set');
    
    setProfileResp = app.waitForResp('POST', ROUTE__API__USER_SET_PROFILE);
    await userMenu.getByRole('button', { name: 'user1' }).click();
    await userMenu.locator('nav').getByRole('button', { name: 'Edit Profile' }).click();
    profileForm = app.getEl(SELECTOR__USER_PROFILE_FORM);
    await profileForm.locator('input[name="username"]').fill('user');
    await profileForm.locator('input[name="password"]').fill('pass1');
    await app.screenshot('User password changed');
    await profileForm.getByRole('button', { name: 'Update' }).click();
    await setProfileResp;
    await expect(profileForm).toHaveCount(0);
    await app.screenshot('User password updated');
    
    await userMenu.getByRole('button', { name: 'user' }).click();
    await userMenu.locator('nav').getByRole('button', { name: 'Logout' }).click();
    await app.getEl('.api-nav').getByRole('button', { name: 'Login' }).isVisible();
    await app.screenshot('User logged out');
  });
  //TOKEN:$TEST__MULTI_USER

  await test.step('should demonstrate multiple tabs', async () => {
    await app.screenshot('Tab 1');
    
    await app.createPage();
    await app.switchToPage(2);
    await app.loadPage();
    
    await app.screenshot('Tab 2');
  });
});

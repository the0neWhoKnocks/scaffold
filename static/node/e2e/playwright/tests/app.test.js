import {
  APP__TITLE,
  //TOKEN:^TEST__MULTI_USER
  PATH__DATA,
  PATH__USERS,
  ROUTE__API__USER_CREATE,
  ROUTE__API__USER_LOGIN,
  ROUTE__API__USER_SET_DATA,
  ROUTE__API__USER_SET_PROFILE,
  //TOKEN:$TEST__MULTI_USER
  //TOKEN:^TEST__WEB_SOCKETS
  WS__MSG__EXAMPLE,
  //TOKEN:$TEST__WEB_SOCKETS
} from '@src/constants'; // eslint-disable-line n/no-missing-import
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

test.describe('Init', () => {
  test('Set Up Config', async ({ app }) => {
    //TOKEN:^TEST__MULTI_USER
    await exec(`rm -rf "${PATH__DATA}/"*`);
    //TOKEN:$TEST__MULTI_USER
    await app.loadPage();
    
    await test.step('Page Title', async () => {
      await expect(app.page).toHaveTitle(APP__TITLE);
    });
    //TOKEN:^TEST__MULTI_USER
    
    await test.step('Fill out App Config', async () => {
      await app.inputAdminConfig('temp', 'pepper');
    });
    //TOKEN:$TEST__MULTI_USER
  });
});

test.describe('Test UI', () => {
  test.beforeEach(async ({ app }) => {
    await app.loadPage();
  });
  //TOKEN:^TEST__API
    
  test('Make a request to the simple API', async ({ app }) => {
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
  
  test('Make a request to an external API', async ({ app }) => {
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
  
  test('Trigger the WebSocket', async ({ app }) => {
    await app.clearLogs();
    
    const { data: { msg } } = await app.waitForWSMsg(
      WS__MSG__EXAMPLE,
      async () => { await app.triggerSocket(); },
    );
    
    await app.verifyLogMsgs({
      msgs: [msg],
      screenshot: { label: 'Socket triggered', loc: '.server-data__logs' },
      type: LOG_TYPE__WEBSOCKET,
    });
  });
  //TOKEN:$TEST__WEB_SOCKETS
  //TOKEN:^TEST__MULTI_USER

  test('Execute User actions', async ({ app }) => {
    const SELECTOR__CREATE_FORM = '.create-form';
    const SELECTOR__LOGIN_FORM = '.login-form';
    const SELECTOR__USER_MENU = '.user-menu';
    const SELECTOR__USER_DATA_FORM = '.user-data-form';
    const SELECTOR__USER_PROFILE_FORM = '.user-profile-form';
    
    await exec(`rm -f "${PATH__USERS}"`);
    
    await app.getEl('.api-nav').getByRole('button', { name: 'Login' }).click();
    await app.screenshot('Login clicked');
    
    let loginFormEl = app.getEl(SELECTOR__LOGIN_FORM);
    await loginFormEl.getByRole('button', { name: 'Create Account' }).click();
    await app.screenshot('Create Account open');
    
    const USERNAME = 'user';
    const PASSWORD = 'pass';
    const createUserResp = app.waitForResp(ROUTE__API__USER_CREATE);
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
    
    const loginResp = app.waitForResp(ROUTE__API__USER_LOGIN);
    await loginFormEl.getByRole('button', { name: 'Log In' }).click();
    await loginResp;
    await expect(loginFormEl).not.toBeAttached();
    await app.screenshot('User logged in');
    
    const userMenu = app.getEl(SELECTOR__USER_MENU);
    await userMenu.getByRole('button', { name: USERNAME }).click();
    await app.screenshot('User menu open');
    
    let setProfileResp = app.waitForResp(ROUTE__API__USER_SET_PROFILE);
    await userMenu.locator('nav').getByRole('button', { name: 'Edit Profile' }).click();
    let profileForm = app.getEl(SELECTOR__USER_PROFILE_FORM);
    await profileForm.locator('input[name="username"]').fill('user1');
    await app.screenshot('User name changed');
    await profileForm.getByRole('button', { name: 'Update' }).click();
    await setProfileResp;
    await expect(profileForm).not.toBeAttached();
    await app.screenshot('User name updated');
    
    const setDataResp = app.waitForResp(ROUTE__API__USER_SET_DATA);
    await userMenu.getByRole('button', { name: 'user1' }).click();
    await userMenu.locator('nav').getByRole('button', { name: 'Set Data' }).click();
    const dataForm = app.getEl(SELECTOR__USER_DATA_FORM);
    await dataForm.locator('textarea').fill('random user data');
    await app.screenshot('User data entered');
    await dataForm.getByRole('button', { name: 'Save' }).click();
    await setDataResp;
    await expect(dataForm).not.toBeAttached();
    await app.screenshot('User data set');
    
    setProfileResp = app.waitForResp(ROUTE__API__USER_SET_PROFILE);
    await userMenu.getByRole('button', { name: 'user1' }).click();
    await userMenu.locator('nav').getByRole('button', { name: 'Edit Profile' }).click();
    profileForm = app.getEl(SELECTOR__USER_PROFILE_FORM);
    await profileForm.locator('input[name="username"]').fill('user');
    await profileForm.locator('input[name="password"]').fill('pass1');
    await app.screenshot('User password changed');
    await profileForm.getByRole('button', { name: 'Update' }).click();
    await setProfileResp;
    await expect(profileForm).not.toBeAttached();
    await app.screenshot('User password updated');
    
    await userMenu.getByRole('button', { name: 'user' }).click();
    await userMenu.locator('nav').getByRole('button', { name: 'Logout' }).click();
    await app.getEl('.api-nav').getByRole('button', { name: 'Login' }).isVisible();
    await app.screenshot('User logged out');
  });
  //TOKEN:$TEST__MULTI_USER
});

test('Demonstrate Multiple Pages', async ({ app }) => {
  const getSID = async () => {
    return app.getEl('.server-data__logs').evaluate((e) => e.textContent.match(/socket id: "([^"]+)"/m)[1]);
  };
  
  await app.loadPage();
  // await app.debug.pause(); // NOTE leaving to demonstrate how to pause the runner
  const p1SID = await getSID();
  await app.screenshot('Page 1');
  
  await app.createPage();
  await app.switchToPage(2);
  await app.loadPage();
  const p2SID = await getSID();
  console.log(p1SID, p2SID); // NOTE leaving to demonstrate how to output logs to the console
  expect(p2SID).not.toEqual(p1SID);
  await app.screenshot('Page 2');
});

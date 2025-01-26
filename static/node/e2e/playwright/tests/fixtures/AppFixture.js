import { exec as _exec } from 'node:child_process';
import { promisify } from 'node:util';
import { test as base, expect } from '@playwright/test';
//TOKEN:^TEST__SERVER_INTERACTIONS
import {
  //TOKEN:^TEST__API
  ROUTE__API__HELLO,
  //TOKEN:$TEST__API
  //TOKEN:^TEST__EXT_API
  ROUTE__API__EXT,
  //TOKEN:$TEST__EXT_API
} from '@src/constants';
//TOKEN:$TEST__SERVER_INTERACTIONS

export const LOG_TYPE__REQUEST = 'request';
export const LOG_TYPE__WEBSOCKET = 'ws';
const PATH__REL_SCREENSHOTS = 'artifacts/screenshots';
const PATH__ABS_SCREENSHOTS = `/e2e/${PATH__REL_SCREENSHOTS}`;
const screenshotNdxs = {};

export const exec = promisify(_exec);
const genShotKeys = (testInfo) => {
  const testFileKey = testInfo.titlePath[0].replace(/\.test\.js$/, '');
  const testNameKey = `[${testInfo.titlePath[1]}]`;
  
  return { testFileKey, testNameKey };
};
const genShotPrefix = ({ testFileKey, testNameKey }) => {
  return `${testFileKey}/${testNameKey}`.toLowerCase().replace(/\s/g, '-');
};
const pad = (num) => `${num}`.padStart(2, '0');

class AppFixture {
  constructor({ browser, context, page, testCtx, testInfo }) {
    if (!testCtx.fixture) testCtx.fixture = this;
    testCtx.fixtures.push(this);
    
    this.browser = browser;
    this.ctx = context;
    this.page = page;
    this.testCtx = testCtx;
    this.testInfo = testInfo;
    
    const { testFileKey, testNameKey } = genShotKeys(testInfo);
    this.testFileKey = testFileKey;
    this.testNameKey = testNameKey;
    this.ndxKey = `${this.testFileKey}_${this.testNameKey}`;
    this.shotNamePrefix = genShotPrefix({ testFileKey, testNameKey });
    //TOKEN:^TEST__SERVER_INTERACTIONS
    //TOKEN:^TEST__REQUESTS
    
    page.apiResps = [];
    page.pendingResps = [];
    page.on('requestfinished', async (req) => {
      let resolvePending;
      page.pendingResps.push(new Promise((resolve) => { resolvePending = resolve; }));
      
      try {
        const resp = await req.response();
        const ct = await resp.headerValue('content-type');
        
        if (ct?.includes('application/json')) {
          const json = await resp.json();
          const msg = ((await resp.url()).includes(ROUTE__API__HELLO))
            ? `API ${JSON.stringify(json)}`
            : await this.decodeHTML(`EXT_API ${json.question} | ${json.answer}`);
          
          page.apiResps.push(msg);
        }
      }
      catch (err) { /**/ }
      
      resolvePending();
    });
    //TOKEN:$TEST__REQUESTS
    //TOKEN:^TEST__WEB_SOCKETS
    
    page.wsMsgs = [];
    page.on('websocket', (ws) => {
      ws.on('framereceived', ({ payload }) => {
        const { data, type } = JSON.parse(payload);
        if (type !== 'pong') page.wsMsgs.push(`WS ${data?.msg}`);
      });
    });
    //TOKEN:$TEST__WEB_SOCKETS
    //TOKEN:$TEST__SERVER_INTERACTIONS
  }
  
  async clearLogs() {
    this.testCtx.fixture.page
      .locator('.server-data__nav')
      .getByRole('button', { name: 'Clear' })
      .click();
    //TOKEN:^TEST__SERVER_INTERACTIONS
    
    //TOKEN:^TEST__REQUESTS
    this.testCtx.fixture.page.apiResps = [];
    //TOKEN:$TEST__REQUESTS
    //TOKEN:^TEST__WEB_SOCKETS
    this.testCtx.fixture.page.wsMsgs = [];
    //TOKEN:$TEST__WEB_SOCKETS
    //TOKEN:$TEST__SERVER_INTERACTIONS
    
    await expect(this.getLogsEl()).toBeEmpty();
  }
  //TOKEN:^TEST__PROXY
  
  clearProxyState() {
    return this.setProxyState();
  }
  //TOKEN:$TEST__PROXY
  
  async closePage(pageNum) {
    const fNdx = pageNum - 1;
    const fx = this.testCtx.fixtures[fNdx];
    
    await fx.page.close();
    await fx.ctx.close();
    
    this.testCtx.fixtures.splice(fNdx, 1);
  }
  
  async createPage() {
    const ctx = await this.testCtx.fixture.browser.newContext();
    const page = await ctx.newPage();
    
    new AppFixture({
      browser: this.testCtx.fixture.browser,
      context: ctx,
      page,
      testCtx: this.testCtx,
      testInfo: this.testCtx.fixture.testInfo,
    });
  }
  //TOKEN:^TEST__EXT_API
  
  decodeHTML(rawTxt) {
    return this.testCtx.fixture.page.evaluate((str) => {
      const el = document.createElement('div');
      el.innerHTML = str;
      return el.textContent;
    }, rawTxt);
  }
  //TOKEN:$TEST__EXT_API
  
  async fill(loc, txt) {
    const page = this.testCtx.fixture.page;
    let _txt = txt;
    
    if (txt.startsWith('{selectall}')) {
      await loc.focus();
      await page.keyboard.press('Meta+A');
      _txt = txt.replace('{selectall}', '');
    }
    
    await loc.fill(_txt);
  }
  //TOKEN:^TEST__SERVER_INTERACTIONS
  
  getAPINav() {
    return this.testCtx.fixture.page.locator('.api-nav');
  }
  //TOKEN:^TEST__SERVER_INTERACTIONS
  
  getLogsEl() {
    return this.testCtx.fixture.page.locator('.server-data__logs');
  }
  //TOKEN:^TEST__MULTI_USER
  
  async inputAdminConfig(cipher, salt) {
    const dialog = await this.testCtx.fixture.waitForDialog();
    await this.fill(dialog.locator('input[name="cipherKey"]'), cipher);
    await this.fill(dialog.locator('input[name="salt"]'), salt);
    await this.screenshot('Config filled out');
    
    await dialog.locator('button[value="create"]').click();
    await this.screenshot('Config created');
  }
  //TOKEN:$TEST__MULTI_USER
  
  async loadPage(str) {
    const route = (str)
      ? (str.startsWith('http')) ? str : `/${str}`
      : '';
    await this.testCtx.fixture.page.goto(route);
  }
  
  async screenshot(name, loc) {
    const _loc = (typeof loc === 'string') ? this.testCtx.fixture.page.locator(loc) : loc; 
    if (!screenshotNdxs[this.testCtx.fixture.ndxKey]) screenshotNdxs[this.testCtx.fixture.ndxKey] = 1;
    
    const screenshotNdx = screenshotNdxs[this.testCtx.fixture.ndxKey];
    const formattedName = `${`${this.testCtx.fixture.shotNamePrefix}_${pad(screenshotNdx)}__${name}`.toLowerCase().replace(/\s/g, '-')}`;
    const filename = `${PATH__REL_SCREENSHOTS}/${formattedName}.jpg`;
    
    screenshotNdxs[this.testCtx.fixture.ndxKey] += 1;
    
    const el = (_loc) ? _loc : this.testCtx.fixture.page;
    const img = await el.screenshot({
      animations: 'disabled', // stops CSS animations, CSS transitions and Web Animations.
      fullPage: !_loc,
      path: filename,
      quality: 90,
      type: 'jpeg',
    });
    this.testInfo.attach(formattedName, {
      body: img,
      contentType: 'image/jpeg',
    });
  }
  //TOKEN:^TEST__PROXY

  async setProxyState(state = {}) {
    await this.testCtx.fixture.page.evaluate((_state) => {
      try {
        return fetch('//TOKEN:#TEST__PROTOCOL://172.17.0.1:9002/state', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(_state),
        });
      }
      catch (err) { console.log(err); }
    }, state);
  }
  //TOKEN:$TEST__PROXY
  
  async switchToPage(pageNum) {
    this.testCtx.fixture = this.testCtx.fixtures[pageNum - 1];
    await this.testCtx.fixture.page.bringToFront();
    await expect(this.testCtx.fixture.page.locator('body')).toBeAttached();
  }
  //TOKEN:^TEST__API
  
  async triggerAPI() {
    const resp = this.waitForResp('GET', ROUTE__API__HELLO);
    await this.getAPINav().getByRole('button', { name: 'Trigger API' }).click();
    
    await this.waitForPending();
    
    return (await resp).json();
  }
  //TOKEN:$TEST__API
  //TOKEN:^TEST__EXT_API
  
  async triggerExtAPI() {
    const resp = this.waitForResp('GET', ROUTE__API__EXT);
    await this.getAPINav().getByRole('button', { name: 'Trigger Ext. API' }).click();
    
    await this.waitForPending();
    
    const json = await (await resp).json();
    json.question = await this.decodeHTML(json.question);
    json.answer = await this.decodeHTML(json.answer);
    
    return json;
  }
  //TOKEN:$TEST__EXT_API
  //TOKEN:^TEST__WEB_SOCKETS
  
  async triggerSocket() {
    await this.getAPINav().getByRole('button', { name: 'Trigger Socket' }).click();
    const msgs = this.testCtx.fixture.page.wsMsgs;
    return msgs[msgs.length - 1];
  }
  //TOKEN:$TEST__WEB_SOCKETS
  //TOKEN:^TEST__SERVER_INTERACTIONS
  
  async verifyLogMsgs({ msgs, screenshot, type }) {
    for (const msg of msgs) {
      switch (type) {
        //TOKEN:^TEST__REQUESTS
        case LOG_TYPE__REQUEST:
          await expect(this.testCtx.fixture.page.apiResps.includes(msg)).toBe(true);
          break;
        //TOKEN:$TEST__REQUESTS
        //TOKEN:^TEST__WEB_SOCKETS
        case LOG_TYPE__WEBSOCKET:
          await expect(this.testCtx.fixture.page.wsMsgs.includes(msg)).toBe(true);
          break;
        //TOKEN:$TEST__WEB_SOCKETS
      }
      
      await expect(this.getLogsEl()).toHaveText(msg);
    }
    
    if (screenshot) {
      const { label, loc } = screenshot;
      await this.screenshot(label, loc);
    }
  }
  //TOKEN:$TEST__SERVER_INTERACTIONS
  
  async verifyPageTitle(title) {
    await expect(await this.testCtx.fixture.page.title()).toBe(title);
  }
  //TOKEN:^TEST__MULTI_USER
  
  async waitForDialog(selector) {
    const dialog = this.testCtx.fixture.page.locator('.dialog');
    await dialog.waitFor({ state: 'visible' });
    
    if (selector) {
      const el = dialog.locator(selector);
      await expect(el).toBeVisible();
    }
    
    return dialog;
  }
  //TOKEN:$TEST__MULTI_USER
  //TOKEN:^TEST__REQUESTS
  
  async waitForPending() {
    await new Promise((resolve) => { setTimeout(() => { resolve(); }, 300); });
    await Promise.all(this.testCtx.fixture.page.pendingResps);
  }
  //TOKEN:$TEST__REQUESTS
  
  waitForResp(method, url) {
    return this.testCtx.fixture.page.waitForResponse(resp => {
      console.log(url, resp.url());
      
      return (
        resp.url().includes(url)
        && resp.status() === 200
        && resp.request().method() === method
      );
    });
  }
}

export const test = base.extend({
  app: async ({ browser, context, page }, use, testInfo) => {
    // [ before test ] =========================================================
    const rmPath = `${PATH__ABS_SCREENSHOTS}/${genShotPrefix(genShotKeys(testInfo))}`;
    await test.step(`Remove old screenshots for "${rmPath}"`, async () => {
      await exec(`rm -rf "${rmPath}"*`); // without quotes, the brackets get misinterpreted
    });
    
    // [ test ] ================================================================
    const testCtx = {
      fixture: undefined,
      fixtures: [],
    };
    const app = new AppFixture({ browser, context, page, testCtx, testInfo });
    await use(app);
    
    // [ after test ] ==========================================================
  },
});

export { expect };

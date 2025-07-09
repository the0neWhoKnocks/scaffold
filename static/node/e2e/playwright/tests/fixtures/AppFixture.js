import BaseFixture, { createTest, expect } from './BaseFixture';
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

class AppFixture extends BaseFixture {
  constructor({ browser, context, page, testCtx, testInfo }) {
    super({ browser, context, page, testCtx, testInfo });
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
  }
  
  async clearLogs() {
    this.fx.page
      .locator('.server-data__nav')
      .getByRole('button', { name: 'Clear' })
      .click();
    //TOKEN:^TEST__SERVER_INTERACTIONS
    
    //TOKEN:^TEST__REQUESTS
    this.fx.page.apiResps = [];
    //TOKEN:$TEST__REQUESTS
    //TOKEN:^TEST__WEB_SOCKETS
    if (this.checkWS) this.fx.page.wsMsgs = [];
    //TOKEN:$TEST__WEB_SOCKETS
    //TOKEN:$TEST__SERVER_INTERACTIONS
    
    await expect(this.getLogsEl()).toBeEmpty();
  }
  //TOKEN:^TEST__PROXY
  
  clearProxyState() {
    return this.setProxyState();
  }
  //TOKEN:$TEST__PROXY
  //TOKEN:^TEST__EXT_API
  
  decodeHTML(rawTxt) {
    return this.fx.page.evaluate((str) => {
      const el = document.createElement('div');
      el.innerHTML = str;
      return el.textContent;
    }, rawTxt);
  }
  //TOKEN:$TEST__EXT_API
  //TOKEN:^TEST__SERVER_INTERACTIONS
  
  getAPINav() {
    return this.fx.page.locator('.api-nav');
  }
  //TOKEN:$TEST__SERVER_INTERACTIONS
  
  getLogsEl() {
    return this.fx.page.locator('.server-data__logs');
  }
  //TOKEN:^TEST__MULTI_USER
  
  async inputAdminConfig(cipher, salt) {
    const dialog = await this.fx.waitForDialog();
    await dialog.locator('input[name="cipherKey"]').fill(cipher);
    await dialog.locator('input[name="salt"]').fill(salt);
    await this.screenshot('Config filled out');
    
    await dialog.locator('button[value="create"]').click();
    await this.screenshot('Config created');
  }
  //TOKEN:$TEST__MULTI_USER
  //TOKEN:^TEST__PROXY

  async setProxyState(state = {}) {
    await this.fx.page.evaluate((_state) => {
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
    const msgs = this.fx.page.wsMsgs;
    return msgs[msgs.length - 1];
  }
  //TOKEN:$TEST__WEB_SOCKETS
  //TOKEN:^TEST__SERVER_INTERACTIONS
  
  async verifyLogMsgs({ msgs, screenshot, type }) {
    for (const msg of msgs) {
      switch (type) {
        //TOKEN:^TEST__REQUESTS
        case LOG_TYPE__REQUEST:
          await expect(this.fx.page.apiResps.includes(msg)).toBe(true);
          break;
        //TOKEN:$TEST__REQUESTS
        //TOKEN:^TEST__WEB_SOCKETS
        case LOG_TYPE__WEBSOCKET:
          await expect(this.fx.page.wsMsgs.includes(msg)).toBe(true);
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
    await expect(await this.fx.page.title()).toBe(title);
  }
  //TOKEN:^TEST__REQUESTS
  
  async waitForPending() {
    await new Promise((resolve) => { setTimeout(() => { resolve(); }, 300); });
    await Promise.all(this.fx.page.pendingResps);
  }
  //TOKEN:$TEST__REQUESTS
}

export const test = createTest({ FxClass: AppFixture, fxKey: 'app' });
export { expect };

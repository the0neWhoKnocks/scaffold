import BaseFixture, { createTest, expect } from './BaseFixture';
//TOKEN:^TEST__SERVER_INTERACTIONS
import {
  //TOKEN:^TEST__API
  ROUTE__API__HELLO,
  //TOKEN:$TEST__API
  //TOKEN:^TEST__EXT_API
  ROUTE__API__EXT,
  //TOKEN:$TEST__EXT_API
} from '@src/constants'; // eslint-disable-line n/no-missing-import
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
  //TOKEN:^TEST__PROXY
  
  static clearProxyState() { return AppFixture.setProxyState(); }
  
  static setProxyState(state = {}) {
    return fetch('//TOKEN:#TEST__PROTOCOL://172.17.0.1:9002/state', {
      method: 'PUT',
      headers: { 'Content-type': 'application/json; charset=UTF-8' },
      body: JSON.stringify(state),
    });
  }
  //TOKEN:$TEST__PROXY
  
  async clearLogs() {
    await this.getEl('.server-data__nav button:text-is("Clear")').click();
    //TOKEN:^TEST__SERVER_INTERACTIONS
    
    //TOKEN:^TEST__REQUESTS
    this.fx.page.apiResps = [];
    //TOKEN:$TEST__REQUESTS
    //TOKEN:^TEST__WEB_SOCKETS
    if (this.checkWS) this.fx.page.wsMsgs = [];
    //TOKEN:$TEST__WEB_SOCKETS
    //TOKEN:$TEST__SERVER_INTERACTIONS
    
    await expect(
      this.getLogsEl(),
      'Log entries should have been cleared'
    ).toBeEmpty();
  }
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
    return this.getEl('.api-nav');
  }
  //TOKEN:$TEST__SERVER_INTERACTIONS
  
  getLogsEl() {
    return this.getEl('.server-data__logs');
  }
  //TOKEN:^TEST__MULTI_USER
  
  async inputAdminConfig(cipher, salt) {
    const dialog = await this.waitForDialog();
    await dialog.locator('input[name="cipherKey"]').fill(cipher);
    await dialog.locator('input[name="salt"]').fill(salt);
    await this.screenshot('Config filled out');
    
    await dialog.locator('button[value="create"]').click();
    await this.screenshot('Config created');
  }
  //TOKEN:$TEST__MULTI_USER
  //TOKEN:^TEST__API
  
  async triggerAPI() {
    const resp = this.waitForResp(ROUTE__API__HELLO);
    await this.getAPINav().getByRole('button', { name: 'Trigger API' }).click();
    
    await this.waitForPending();
    
    return (await resp).json();
  }
  //TOKEN:$TEST__API
  //TOKEN:^TEST__EXT_API
  
  async triggerExtAPI() {
    const resp = this.waitForResp(ROUTE__API__EXT);
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
          expect(
            this.fx.page.apiResps.includes(msg),
            'Response should contain message'
          ).toTruthy();
          break;
        //TOKEN:$TEST__REQUESTS
        //TOKEN:^TEST__WEB_SOCKETS
        case LOG_TYPE__WEBSOCKET:
          await expect(
            this.fx.page.wsMsgs.includes(msg),
            'WebSocket payload should contain message'
          ).toBe(true);
          break;
        //TOKEN:$TEST__WEB_SOCKETS
      }
      
      await expect(
        this.getLogsEl(),
        'Log entry should contain message'
      ).toHaveText(msg);
    }
    
    if (screenshot) {
      const { label, loc } = screenshot;
      await this.screenshot(label, loc);
    }
  }
  //TOKEN:$TEST__SERVER_INTERACTIONS
  //TOKEN:^TEST__REQUESTS
  
  async waitForPending() {
    await new Promise((resolve) => { setTimeout(() => { resolve(); }, 300); });
    await Promise.all(this.fx.page.pendingResps);
  }
  //TOKEN:$TEST__REQUESTS
}

export const test = createTest({ FxClass: AppFixture, fxKey: 'app' });
export { expect };

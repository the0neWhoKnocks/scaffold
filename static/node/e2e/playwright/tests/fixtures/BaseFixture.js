import { exec as _exec } from 'node:child_process';
import { promisify } from 'node:util';
import { test, expect } from '@playwright/test';

const PATH__REL_SCREENSHOTS = 'artifacts/screenshots';
const PATH__ABS_SCREENSHOTS = `/e2e/${PATH__REL_SCREENSHOTS}`;
const screenshotNdxs = {};

const exec = promisify(_exec);
const genShotKeys = (testInfo) => {
  const testFileKey = testInfo.titlePath[0].replace(/\.test\.js$/, '');
  const testNameKey = `[${testInfo.titlePath[1]}]`;
  
  return { testFileKey, testNameKey }; 
};
const genShotPrefix = ({ testFileKey, testNameKey }) => {
  return `${testFileKey}/${testNameKey}`.toLowerCase().replace(/\s/g, '-');
};
const pad = (num) => `${num}`.padStart(2, '0');

export default class BaseFixture {
  constructor({
    browser,
    checkDialogs = false,
    checkWS = false,
    context,
    page,
    testCtx,
    testInfo,
  }) {
    if (!testCtx.fixture) testCtx.fixture = this;
    testCtx.fixtures.push(this);
    
    this.browser = browser;
    this.checkDialogs = checkDialogs;
    this.checkWS = checkWS;
    this.ctx = context;
    this.fx = testCtx.fixture;
    this.page = page;
    this.testCtx = testCtx;
    this.testInfo = testInfo;
    
    const { testFileKey, testNameKey } = genShotKeys(testInfo);
    this.testFileKey = testFileKey;
    this.testNameKey = testNameKey;
    this.ndxKey = `${this.testFileKey}_${this.testNameKey}`;
    this.shotNamePrefix = genShotPrefix({ testFileKey, testNameKey });
    
    if (checkDialogs) {
      page.dialogMsg = null;
      page.on('dialog', async (d) => {
        page.dialogMsg = d.message();
        await d.accept();
      });
    }
    
    if (checkWS) {
      page.wsMsgs = [];
      page.on('websocket', (ws) => {
        ws.on('framereceived', ({ payload }) => {
          const { data, type } = JSON.parse(payload);
          if (type !== 'pong') page.wsMsgs.push(`WS ${data?.msg}`);
        });
      });
    }
  }
  
  async chooseFile(filePath, fn) {
    const [ fcPromise ] = await Promise.all([
      this.fx.page.waitForEvent('filechooser'),
      fn(),
    ]);
    
    const fileChooser = await fcPromise;
    await fileChooser.setFiles(filePath);
  }
  
  async closePage(pageNum) {
    const fNdx = pageNum - 1;
    const fx = this.testCtx.fixtures[fNdx];
    
    await fx.page.close();
    await fx.ctx.close();
    
    this.testCtx.fixtures.splice(fNdx, 1);
  }
  
  async createPage() {
    const ctx = await this.fx.browser.newContext();
    const page = await ctx.newPage();
    
    new this.constructor({
      browser: this.fx.browser,
      context: ctx,
      page,
      testCtx: this.testCtx,
      testInfo: this.fx.testInfo,
    });
  }
  
  async downloadFile(fn) {
    const [ download ] = await Promise.all([
      this.fx.page.waitForEvent('download'),
      fn(),
    ]);
    const suggestedFileName = download.suggestedFilename();
    const filePath = `/tmp/${suggestedFileName}`;
    
    await download.saveAs(filePath);
    
    return filePath;
  }
  
  exec(...args) { return exec(...args); }
  
  getElBySelector(sel) {
    return this.fx.page.locator(sel);
  }
  
  getFocusedEl() {
    return this.getElBySelector('*:focus');
  }
  
  getURLParts() {
    return new URL(this.fx.page.url());
  }
  
  async goOffline() {
    await this.fx.ctx.setOffline(true);
  }
  
  async goOnline() {
    await this.fx.ctx.setOffline(false);
  }
  
  async loadPage(str) {
    const route = (str)
      ? (str.startsWith('http')) ? str : `/${str}`
      : '';
    await this.fx.page.goto(route);
  }
  
  async readClipboard() {
    await this.fx.ctx.grantPermissions(['clipboard-read']);
    const handle = await this.fx.page.evaluateHandle(() => navigator.clipboard.readText());
    const txt = await handle.jsonValue();
    await handle.dispose();
    return txt;
  }
  
  async screenshot(name, loc) {
    const _loc = (typeof loc === 'string') ? this.getElBySelector(loc) : loc; 
    if (!screenshotNdxs[this.fx.ndxKey]) screenshotNdxs[this.fx.ndxKey] = 1;
    
    const screenshotNdx = screenshotNdxs[this.fx.ndxKey];
    const formattedName = `${`${this.fx.shotNamePrefix}_${pad(screenshotNdx)}__${name}`.toLowerCase().replace(/\s/g, '-')}`;
    const filename = `${PATH__REL_SCREENSHOTS}/${formattedName}.jpg`;
    
    screenshotNdxs[this.fx.ndxKey] += 1;
    
    const el = (_loc) ? _loc : this.fx.page;
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
  
  async switchToPage(pageNum) {
    this.fx = this.testCtx.fixtures[pageNum - 1];
    await this.fx.page.bringToFront();
    await expect(this.getElBySelector('body')).toBeAttached();
  }
  
  async validateAlert(msg, fn) {
    const dialogPromise = this.fx.page.waitForEvent('dialog');
    await fn();
    await dialogPromise;
    
    await expect(
      await this.fx.page.dialogMsg,
      'should display alert containin message'
    ).toContain(msg);
  }
  
  async waitForDialog(selector) {
    let dialog = this.getElBySelector('.dialog');
    
    if (selector) {
      dialog = dialog.filter({
        has: this.getElBySelector(selector),
        visible: true,
      });
    }
    
    await dialog.waitFor({ state: 'visible' });
    
    return dialog;
  }
  
  async waitForAnimations(loc) {
    await loc.evaluate(el => Promise.all(el.getAnimations({ subtree: true }).map(animation => animation.finished)));
  }
  
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
  
  async writeClipboard() {
    await this.fx.ctx.grantPermissions(['clipboard-write']);
  }
}

export function createTest({
  afterTest,
  beforeTest,
  FxClass,
  fxKey,
}) {
  const removed = {};
  
  return test.extend({
    [fxKey]: async ({ browser, context, page }, use, testInfo) => {
      const testCtx = {
        fixture: undefined,
        fixtures: [],
      };
      
      // [ before test ] =========================================================
      const rmPath = `${PATH__ABS_SCREENSHOTS}/${genShotPrefix(genShotKeys(testInfo))}`;
      if (!removed[rmPath]) {
        await test.step(`Remove old screenshots for "${rmPath}"`, async () => {
          await exec(`rm -rf "${rmPath}"*`); // without quotes, the brackets get misinterpreted
        });
        removed[rmPath] = true;
      }
      
      if (beforeTest) await beforeTest({ browser, context, page, testCtx, testInfo });
      
      // [ test ] ================================================================
      await use(new FxClass({ browser, context, page, testCtx, testInfo }));
      
      // [ after test ] ==========================================================
      if (afterTest) await afterTest({ browser, context, page, testCtx, testInfo });
    },
  });
}

export { expect };

context('App', () => {
  //TOKEN:^TEST__MULTI_USER
  const SELECTOR__CREATE_FORM = '.create-form';
  //TOKEN:$TEST__MULTI_USER
  const SELECTOR__DIALOG = '.dialog';
  //TOKEN:^TEST__MULTI_USER
  const SELECTOR__LOGIN_FORM = '.login-form';
  //TOKEN:$TEST__MULTI_USER
  const SELECTOR__SERVER_DATA = '.server-data';
  //TOKEN:^TEST__MULTI_USER
  const SELECTOR__USER_MENU = '.user-menu';
  const SELECTOR__USER_DATA_FORM = '.user-data-form';
  const SELECTOR__USER_PROFILE_FORM = '.user-profile-form';
  //TOKEN:$TEST__MULTI_USER
  const SELECTOR__VIEW = '#view';
  
  let screenshotNdx = 0;
  const pad = (num, token='00') => token.substring(0, token.length-`${ num }`.length) + num;
  function screenshot(name, selector) {
    screenshotNdx++;
    
    const filename = `${ pad(screenshotNdx) }__${ name.replace(/\s/g, '-') }`;
    
    if (selector) cy.get(selector).screenshot(filename);
    else cy.screenshot(filename);
  }
  
  function loadPage() {
    cy.visit('/');
  }
  
  function setUpAliases() {
    cy.get(SELECTOR__VIEW).as('VIEW');
  }
  
  function resetWorkspace() {
    cy.exec(`rm -rf /e2e/cypress/screenshots/app.test.js/*`);
    //TOKEN:^TEST__MULTI_USER
    cy.exec(`rm -rf /app/data/*`);
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
    //TOKEN:$TEST__MULTI_USER
  }
  //TOKEN:^TEST__MULTI_USER
  
  function waitForReloadAfter(action) {
    const key = 'currPage';
  
    // Since there's not a built-in way of checking when a page has reloaded, set
    // a variable on the `window`, then after a reload, said variable should be
    // gone, and tests can proceed.
    cy.window().then(win => { win[key] = true; });
  
    action();
  
    // NOTE: In order for this to work I had to set `chromeWebSecurity: false` in `cypress.json`
    cy.window().its(key).should('be.undefined');
  }
  //TOKEN:$TEST__MULTI_USER
  
  before(() => {
    resetWorkspace();
    loadPage();
  });
  
  beforeEach(() => {
    setUpAliases();
  });
  
  it('should have the correct title', () => {
    cy.get('title').contains('/* TOKEN:#TEST__APP_TITLE */');
  });
  //TOKEN:^TEST__MULTI_USER
  
  it('should fill out App config', () => {
    waitForReloadAfter(() => {
      cy.get(`${SELECTOR__DIALOG} input[name="cipherKey"]`).type('temp');
      cy.get(`${SELECTOR__DIALOG} input[name="salt"]`).type('pepper');
      screenshot('Config filled out');
      cy.get(`${SELECTOR__DIALOG} button[value="create"]`).click();
    });
    
    screenshot('Config created');
  });
  //TOKEN:$TEST__MULTI_USER
  //TOKEN:^TEST__API
  
  it('should make a request to the simple API', () => {
    cy.intercept('GET', '/api/hello').as('API__HELLO');
    cy.get('.app nav').contains('Trigger API').click();
    cy.wait('@API__HELLO');
    cy.get(SELECTOR__SERVER_DATA).then(($el) => {
      const logs = $el.text().split('\n').filter(log => log.startsWith('[API]'));
      expect(logs.length).to.equal(2);
    });
    
    screenshot('API triggered');
  });
  //TOKEN:$TEST__API
  //TOKEN:^TEST__WEB_SOCKETS
  
  it('should trigger the WebSocket', () => {
    cy.get('.app nav').contains('Trigger Socket').click();
    cy.get(SELECTOR__SERVER_DATA).then(($el) => {
      const logs = $el.text().split('\n').filter(log => log.startsWith('[WS]'));
      expect(logs.length).to.equal(3);
    });
    
    screenshot('Socket triggered');
  });
  //TOKEN:$TEST__WEB_SOCKETS
  //TOKEN:^TEST__MULTI_USER
  
  it('should execute User actions', () => {
    cy.get('.app nav').contains('Login').click();
    screenshot('Login clicked');
    
    cy.get(`${SELECTOR__LOGIN_FORM} button`).contains('Create Account').click();
    screenshot('Create Account open');
    
    cy.intercept('POST', '/api/user/create').as('API__CREATE_USER');
    cy.get(`${SELECTOR__CREATE_FORM} input[name="username"]`).type('user');
    cy.get(`${SELECTOR__CREATE_FORM} input[name="password"]`).type('pass');
    cy.get(`${SELECTOR__CREATE_FORM} input[name="passwordConfirmed"]`).type('pass');
    cy.get(`${SELECTOR__CREATE_FORM} button`).contains('Create').click();
    cy.wait('@API__CREATE_USER');
    cy.get(`${SELECTOR__LOGIN_FORM} input[name="username"]`).should('have.value', 'user');
    cy.get(`${SELECTOR__LOGIN_FORM} input[name="password"]`).should('have.value', 'pass');
    screenshot('User created');
    
    cy.intercept('POST', '/api/user/login').as('API__LOGIN');
    cy.get(`${SELECTOR__LOGIN_FORM} button`).contains('Log In').click();
    cy.wait('@API__LOGIN');
    cy.get(SELECTOR__LOGIN_FORM).should('not.exist');
    screenshot('User logged in');
    
    cy.get(`${SELECTOR__USER_MENU} > button`).contains('user').click();
    screenshot('User menu open');
    
    cy.intercept('POST', '/api/user/profile/set').as('API__SET_USER');
    cy.get(`${SELECTOR__USER_MENU} nav button`).contains('Edit Profile').click();
    cy.get(`${SELECTOR__USER_PROFILE_FORM} input[name="username"]`).type('{selectall}user1');
    screenshot('User name changed');
    cy.get(`${SELECTOR__USER_PROFILE_FORM} button`).contains('Update').click();
    cy.wait('@API__SET_USER');
    cy.get(SELECTOR__USER_PROFILE_FORM).should('not.exist');
    screenshot('User name updated');
    
    cy.intercept('POST', '/api/user/data/set').as('API__SET_USER_DATA');
    cy.get(`${SELECTOR__USER_MENU} > button`).contains('user1').click();
    cy.get(`${SELECTOR__USER_MENU} nav button`).contains('Set Data').click();
    cy.get(`${SELECTOR__USER_DATA_FORM} textarea`).type('random user data');
    screenshot('User data entered');
    cy.get(`${SELECTOR__USER_DATA_FORM} button`).contains('Save').click();
    cy.wait('@API__SET_USER_DATA');
    cy.get(SELECTOR__USER_DATA_FORM).should('not.exist');
    screenshot('User data set');
    
    cy.get(`${SELECTOR__USER_MENU} > button`).contains('user1').click();
    cy.get(`${SELECTOR__USER_MENU} nav button`).contains('Edit Profile').click();
    cy.get(`${SELECTOR__USER_PROFILE_FORM} input[name="username"]`).type('{selectall}user');
    cy.get(`${SELECTOR__USER_PROFILE_FORM} input[name="password"]`).type('{selectall}pass1');
    screenshot('User password changed');
    cy.get(`${SELECTOR__USER_PROFILE_FORM} button`).contains('Update').click();
    cy.wait('@API__SET_USER');
    cy.get(SELECTOR__USER_PROFILE_FORM).should('not.exist');
    screenshot('User password updated');
    
    cy.get(`${SELECTOR__USER_MENU} > button`).contains('user').click();
    cy.get(`${SELECTOR__USER_MENU} nav button`).contains('Logout').click();
    cy.get('.app nav').contains('Login');
    screenshot('User logged out');
  });
  //TOKEN:$TEST__MULTI_USER
});

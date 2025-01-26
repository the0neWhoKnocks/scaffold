import c from '/src/constants';

const {
  APP__TITLE,
  //TOKEN:^TEST__EXT_API
  ROUTE__API__EXT,
  //TOKEN:$TEST__EXT_API
  //TOKEN:^TEST__API
  ROUTE__API__HELLO,
  //TOKEN:$TEST__API
  //TOKEN:^TEST__MULTI_USER
  ROUTE__API__USER_CREATE,
  ROUTE__API__USER_LOGIN,
  ROUTE__API__USER_SET_DATA,
  ROUTE__API__USER_SET_PROFILE,
  //TOKEN:$TEST__MULTI_USER
} = c;

context('App', () => {
  //TOKEN:^TEST__MULTI_USER
  const SELECTOR__CREATE_FORM = '.create-form';
  //TOKEN:$TEST__MULTI_USER
  const SELECTOR__DIALOG = '.dialog';
  //TOKEN:^TEST__MULTI_USER
  const SELECTOR__LOGIN_FORM = '.login-form';
  //TOKEN:$TEST__MULTI_USER
  //TOKEN:^TEST__SERVER_INTERACTIONS
  const SELECTOR__SERVER_DATA_LOGS = '.server-data__logs';
  //TOKEN:$TEST__SERVER_INTERACTIONS
  //TOKEN:^TEST__MULTI_USER
  const SELECTOR__USER_MENU = '.user-menu';
  const SELECTOR__USER_DATA_FORM = '.user-data-form';
  const SELECTOR__USER_PROFILE_FORM = '.user-profile-form';
  //TOKEN:$TEST__MULTI_USER
  const SELECTOR__VIEW = '#view';
  
  
  function loadPage() {
    cy.visit('/');
  }
  
  function setUpAliases() {
    cy.get(SELECTOR__VIEW).as('VIEW');
  }
  
  //TOKEN:^TEST__MULTI_USER
  function resetWorkspace() {
    cy.exec(`rm -rf /app_data/*`);
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  }
  
  function waitForReloadAfter(action) {
    const key = 'currPage';
  
    // Since there's not a built-in way of checking when a page has reloaded, set
    // a variable on the `window`, then after a reload, said variable should be
    // gone, and tests can proceed.
    cy.window().then(win => { win[key] = true; });
  
    action();
  
    // NOTE: In order for this to work I had to set `chromeWebSecurity: false` in `cypress.config.js`
    cy.window().its(key).should('be.undefined');
  }
  //TOKEN:$TEST__MULTI_USER
  
  before(() => {
    //TOKEN:^TEST__MULTI_USER
    resetWorkspace();
    //TOKEN:$TEST__MULTI_USER
    loadPage();
  });
  
  beforeEach(() => {
    setUpAliases();
  });
  
  it('should have the correct title', () => {
    cy.get('title').contains(APP__TITLE);
  });
  //TOKEN:^TEST__MULTI_USER
  
  it('should fill out App config', () => {
    waitForReloadAfter(() => {
      cy.get(`${SELECTOR__DIALOG} input[name="cipherKey"]`).type('temp');
      cy.get(`${SELECTOR__DIALOG} input[name="salt"]`).type('pepper');
      cy.screenshot('Config filled out');
      cy.get(`${SELECTOR__DIALOG} button[value="create"]`).click();
    });
    
    cy.screenshot('Config created');
  });
  //TOKEN:$TEST__MULTI_USER
  //TOKEN:^TEST__API
  
  it('should make a request to the simple API', () => {
    cy.intercept('GET', ROUTE__API__HELLO).as('API__HELLO');
    cy.get('.app nav').contains('Trigger API').click();
    cy.wait('@API__HELLO');
    cy.get(`${SELECTOR__SERVER_DATA_LOGS} div`).then(($logs) => {
      let logs = [];
      $logs.each((ndx, log) => { logs.push(log.textContent); });
      logs = logs.filter(log => log.startsWith('API'));
      expect(logs.length).to.equal(2);
    });
    
    cy.screenshot('API triggered');
  });
  //TOKEN:$TEST__API
  //TOKEN:^TEST__EXT_API
  
  it('should make a request to an external API', () => {
    cy.intercept('GET', ROUTE__API__EXT).as('API__EXT');
    
    cy.get('.app nav').contains('Trigger Ext. API').click();
    cy.wait('@API__EXT');
    cy.get(`${SELECTOR__SERVER_DATA_LOGS} div`).then(($logs) => {
      let logs = [];
      $logs.each((ndx, log) => { logs.push(log.textContent); });
      logs = logs.filter(log => log.startsWith('EXT_API'));
      expect(logs.length).to.equal(1);
    });
    //TOKEN:^TEST__PROXY
    
    const q = "I'm a mocked trivia question!";
    const a = 'True';
    cy.setProxyState({ mockData: [{ question: q, correct_answer: a }] });
    cy.get('.app nav').contains('Trigger Ext. API').click();
    cy.wait('@API__EXT');
    cy.get(`${SELECTOR__SERVER_DATA_LOGS} div`).then(($logs) => {
      let logs = [];
      $logs.each((ndx, log) => { logs.push(log.textContent); });
      logs = logs.filter(log => log.startsWith('EXT_API'));
      expect(logs.length).to.equal(2);
      expect(logs[1]).to.contain(`${q} | ${a}`);
    });
    cy.clearProxyState();
    //TOKEN:$TEST__PROXY
    
    cy.screenshot('ext API triggered');
  });
  //TOKEN:$TEST__EXT_API
  //TOKEN:^TEST__WEB_SOCKETS
  
  it('should trigger the WebSocket', () => {
    cy.get('.app nav').contains('Trigger Socket').click();
    cy.get(`${SELECTOR__SERVER_DATA_LOGS} div`).then(($logs) => {
      let logs = [];
      $logs.each((ndx, log) => { logs.push(log.textContent); });
      logs = logs.filter(log => log.startsWith('WS'));
      expect(logs.length).to.equal(3);
    });
    
    cy.screenshot('Socket triggered');
  });
  //TOKEN:$TEST__WEB_SOCKETS
  //TOKEN:^TEST__MULTI_USER
  
  it('should execute User actions', () => {
    cy.get('.app nav').contains('Login').click();
    cy.screenshot('Login clicked');
    
    cy.get(`${SELECTOR__LOGIN_FORM} button`).contains('Create Account').click();
    cy.screenshot('Create Account open');
    
    cy.intercept('POST', ROUTE__API__USER_CREATE).as('API__CREATE_USER');
    cy.get(`${SELECTOR__CREATE_FORM} input[name="username"]`).type('user');
    cy.get(`${SELECTOR__CREATE_FORM} input[name="password"]`).type('pass');
    cy.get(`${SELECTOR__CREATE_FORM} input[name="passwordConfirmed"]`).type('pass');
    cy.get(`${SELECTOR__CREATE_FORM} button`).contains('Create').click();
    cy.wait('@API__CREATE_USER');
    cy.get(`${SELECTOR__LOGIN_FORM} input[name="username"]`).should('have.value', 'user');
    cy.get(`${SELECTOR__LOGIN_FORM} input[name="password"]`).should('have.value', 'pass');
    cy.screenshot('User created');
    
    cy.intercept('POST', ROUTE__API__USER_LOGIN).as('API__LOGIN');
    cy.get(`${SELECTOR__LOGIN_FORM} button`).contains('Log In').click();
    cy.wait('@API__LOGIN');
    cy.get(SELECTOR__LOGIN_FORM).should('not.exist');
    cy.screenshot('User logged in');
    
    cy.get(`${SELECTOR__USER_MENU} > button`).contains('user').click();
    cy.screenshot('User menu open');
    
    cy.intercept('POST', ROUTE__API__USER_SET_PROFILE).as('API__SET_USER');
    cy.get(`${SELECTOR__USER_MENU} nav button`).contains('Edit Profile').click();
    cy.get(`${SELECTOR__USER_PROFILE_FORM} input[name="username"]`).type('{selectall}user1');
    cy.screenshot('User name changed');
    cy.get(`${SELECTOR__USER_PROFILE_FORM} button`).contains('Update').click();
    cy.wait('@API__SET_USER');
    cy.get(SELECTOR__USER_PROFILE_FORM).should('not.exist');
    cy.screenshot('User name updated');
    
    cy.intercept('POST', ROUTE__API__USER_SET_DATA).as('API__SET_USER_DATA');
    cy.get(`${SELECTOR__USER_MENU} > button`).contains('user1').click();
    cy.get(`${SELECTOR__USER_MENU} nav button`).contains('Set Data').click();
    cy.get(`${SELECTOR__USER_DATA_FORM} textarea`).type('random user data');
    cy.screenshot('User data entered');
    cy.get(`${SELECTOR__USER_DATA_FORM} button`).contains('Save').click();
    cy.wait('@API__SET_USER_DATA');
    cy.get(SELECTOR__USER_DATA_FORM).should('not.exist');
    cy.screenshot('User data set');
    
    cy.get(`${SELECTOR__USER_MENU} > button`).contains('user1').click();
    cy.get(`${SELECTOR__USER_MENU} nav button`).contains('Edit Profile').click();
    cy.get(`${SELECTOR__USER_PROFILE_FORM} input[name="username"]`).type('{selectall}user');
    cy.get(`${SELECTOR__USER_PROFILE_FORM} input[name="password"]`).type('{selectall}pass1');
    cy.screenshot('User password changed');
    cy.get(`${SELECTOR__USER_PROFILE_FORM} button`).contains('Update').click();
    cy.wait('@API__SET_USER');
    cy.get(SELECTOR__USER_PROFILE_FORM).should('not.exist');
    cy.screenshot('User password updated');
    
    cy.get(`${SELECTOR__USER_MENU} > button`).contains('user').click();
    cy.get(`${SELECTOR__USER_MENU} nav button`).contains('Logout').click();
    cy.get('.app nav').contains('Login');
    cy.screenshot('User logged out');
  });
  //TOKEN:$TEST__MULTI_USER
});

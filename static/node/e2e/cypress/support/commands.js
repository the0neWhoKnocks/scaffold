// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })


const pad = (num) => `${num}`.padStart(2, '0');
const screenshotNdxs = {};

/**
 * Custom screenshot implementation
 *
 * @param {Function} originalFn - (auto populated) The actual `cy.screenshot` function.
 * @param {Object} subject - (auto populated) A DOM element Object. Is set when chained from `cy.get`.
 * @param {String} name - The name of the screenshot.
 * @param {String|Object} selector - Selector to capture specific element. Or the `options` Object.
 * @param {Object} opts - A `cy.screenshot` `options` Object.
 *
 * @return {Object} A Cypress Object
 * 
 * @example
 * ```js
 * // Capture entire screen
 * cy.screenshot('image A');
 *   
 * // Capture a specific element/area.
 * cy.get('.selector').screenshot('image B');
 * cy.screenshot('image C', '.selector');
 * ```
 */
const screenshot = (originalFn, subject, name, selector, opts = {}) => {
  const PATH__SCREENSHOTS = '/e2e/cypress/screenshots';
  const testFileKey = Cypress.spec.absolute;
  let _opts;
  let _selector;
  
  if (typeof selector === 'string') _selector = selector;
  else _opts = selector || {};
  
  if (typeof opts === 'object') _opts = opts;
  _opts = { overwrite: true, ..._opts };
  
  if (!screenshotNdxs[testFileKey]) {
    // delete old screenshots for current test file
    cy.exec(`rm -rf ${PATH__SCREENSHOTS}/${Cypress.spec.name}/*`);
    
    screenshotNdxs[testFileKey] = 1;
  }
  
  const screenshotNdx = screenshotNdxs[testFileKey];
  // NOTE: There's a known issue (that isn't being worked on) where the
  // screenshots don't get placed in a spec directory (when in `open` mode), but
  // this seems to fix it.
  // https://github.com/cypress-io/cypress/issues/22339
  const dirPrefix = (Cypress.config('isInteractive'))
    ? `${Cypress.spec.name}/`
    : '';
  const filename = `${dirPrefix}${pad(screenshotNdx)}__${name.replace(/\s/g, '-')}`;
  
  screenshotNdxs[testFileKey] += 1;
  
  (_selector)
    // get element, then take cropped screenshot of it
    ? cy.get(_selector).then((el) => originalFn(el, filename, _opts))
    // screenshot of entire screen
    : originalFn(subject, filename, _opts);
};
Cypress.Commands.overwrite('screenshot', screenshot);

/**
 * Useful when saving results as aliases and you need to refer to those results
 * later.
 * 
 * @example
 * ```js
 * cy.getAliases('data').then(({ prop1, prop2 }) => {
 *   expect(prop1).to.equal(3);
 *   expect(prop2).to.equal('fu');
 * });
 * 
 * cy.getAliases('val1', 'val2').then(([ val1, val2 ]) => {
 *   expect(val1).not.to.equal(val2);
 * });
 * ```
 */
Cypress.Commands.add('getAliases', function(...aliasNames) { 
  const arr = aliasNames.map(a => this[a]);
  return (arr.length === 1) ? arr[0] : arr;
});

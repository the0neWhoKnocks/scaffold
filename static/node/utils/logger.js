require('ulog');
const { NAMESPACE__LOGGER } = require('../constants');

//TOKEN:^LOGGER__DEFAULT
function l(namespace) {
  const lg = (...args) => {
    console.log(`[${LOGGER__NAMESPACE}:${namespace}]`, ...args);
  };
  
  function _l(...args) {
    lg(...args);
  }
  _l.debug = lg;
  _l.error = lg;
  _l.info = lg;
  _l.warn = lg;
  
  return _l;
}

const logger = l;
//TOKEN:$LOGGER__DEFAULT
//TOKEN:^LOGGER__CUSTOM
const aL = require('anylogger');
const rootLogger = aL(NAMESPACE__LOGGER);

const logger = (namespace = '') => (namespace)
  ? aL(`${NAMESPACE__LOGGER}:${namespace}`)
  : rootLogger;
//TOKEN:$LOGGER__CUSTOM

module.exports = logger;

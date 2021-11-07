const { NAMESPACE__LOGGER } = require('../constants');

//TOKEN:^LOGGER__DEFAULT
function l(namespace) {
  const lg = (...args) => {
    console.log(`[${NAMESPACE__LOGGER}:${namespace}]`, ...args);
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
const ulog = require('ulog');
// NOTE: Overriding the log_format because of: https://github.com/Download/ulog/issues/68
ulog.config.log_format = 'lvl noPadName message';
if (process.env.FOR_CLIENT_BUNDLE) {
  ulog.config.log = 'debug';
  window.localStorage.log = ulog.config.log;
  window.localStorage.log_format = ulog.config.log_format;
}
ulog.use({
  use: [ require('ulog/mods/formats') ],
  formats: {
    noPadName: () => {
      const fmt = (rec) => rec.name;
      fmt.color = 'logger';
      return fmt;
    },
  },
});

const aL = require('anylogger');
const rootLogger = aL(NAMESPACE__LOGGER);

const logger = (namespace = '') => (namespace)
  ? aL(`${NAMESPACE__LOGGER}:${namespace}`)
  : rootLogger;
//TOKEN:$LOGGER__CUSTOM

module.exports = logger;

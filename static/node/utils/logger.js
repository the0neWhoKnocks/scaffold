const { LOGGER__NAMESPACE } = require('../constants');

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
let logger;

if (
  process.env.NODE_ENV === 'production'
  && process.env.FOR_CLIENT_BUNDLE
) {
  logger = () => () => {};
}
else {
  const aL = require('anylogger');
  const rootLogger = aL(LOGGER__NAMESPACE);
  const enabled = [
    `${LOGGER__NAMESPACE}:*`,
  ];
  // TODO
  // const disabled = [
  //   `-${LOGGER__NAMESPACE}:*heartbeat*`,
  // ];

  // TODO - logging not working
  
  logger = (namespace = '') => (namespace)
    ? aL(`${LOGGER__NAMESPACE}:${namespace}`)
    : rootLogger;
  
  // TODO
  // debug.enable( [ ...enabled, ...disabled ].join(',') );
}
//TOKEN:$LOGGER__CUSTOM

module.exports = logger;

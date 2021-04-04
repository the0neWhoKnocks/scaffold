const { LOGGER__NAMESPACE } = require('../constants');

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

  logger = (namespace = '') => (namespace)
    ? rootLogger.extend(namespace)
    : rootLogger;
  
  // TODO
  // debug.enable( [ ...enabled, ...disabled ].join(',') );
}

module.exports = logger;

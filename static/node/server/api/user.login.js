const log = require('../../utils/logger')('api.user.login');
const decrypt = require('../utils/decrypt');
const encrypt = require('../utils/encrypt');
const loadUsers = require('../utils/loadUsers');

module.exports = function userLogin(req, res) {
  const {
    appConfig,
    body: { password, username },
  } = req;
  
  if (!password || !username) {
    const msg = `Looks like you're missing some data.\n  Username: "${username}"\n  Password: "${password}"`;
    log.error(msg);
    return res.sendError(400, msg);
  }
  
  Promise.all([
    encrypt(appConfig, username),
    loadUsers(),
  ])
    .then(([
      { valueHex: encryptedUsername },
      users,
    ]) => {
      if (!users[encryptedUsername]) {
        const msg = `An account for "${username}" doesn't exist.`;
        log.error(msg);
        return res.sendError(404, msg);
      }
      
      decrypt(appConfig, users[encryptedUsername], password)
        .then((decryptedUserData) => {
          const userData = JSON.parse(decryptedUserData);
          
          log.info(`User "${userData.username}" logged in`);
          res.sendJSON(userData);
        })
        .catch((err) => {
          if (
            err.message.includes('bad decrypt')
            || err.message.includes('unable to authenticate data')
          ) {
            const msg = `Credentials were invalid for Username: "${username}" | Password: "${password}"`;
            log.error(msg);
            return res.sendError(500, msg);
          }
          
          const msg = `The Server encountered a problem while trying to log you in:\n${err.stack}`;
          log.error(msg);
          res.sendError(500, msg);
        });
    });
}

const { writeFile } = require('fs');
const { PATH__USERS } = require('../../constants');
const log = require('../../utils/logger')('api.user.create');
const encrypt = require('../utils/encrypt');
const loadUsers = require('../utils/loadUsers');

module.exports = function createUser(req, res) {
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
    encrypt(appConfig, { password, username }, password),
    loadUsers(),
  ])
    .then(([
      { valueHex: encryptedUsername },
      { combined: encryptedUserData },
      users,
    ]) => {
      if (users[encryptedUsername]) {
        const msg = `User "${username}" already exists`;
        log.error(msg);
        return res.sendError(405, msg);
      }
      
      users[encryptedUsername] = encryptedUserData;
      writeFile(PATH__USERS, JSON.stringify(users, null, 2), 'utf8', (err) => {
        if (err) {
          const msg = `Failed to write file while creating User | ${err}`;
          log.error(msg);
          return res.sendError(500, msg);
        }
        
        const message = `Created User for "${username}"`;
        log.info(message);
        res.sendJSON({ message });
      });
    });
}

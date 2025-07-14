const { writeFile } = require('node:fs/promises');
const { PATH__USERS } = require('../../constants');
const log = require('../../utils/logger')('api.user.create');
const encrypt = require('../utils/encrypt');
const loadUsers = require('../utils/loadUsers');

module.exports = async function createUserProfile(req, res) {
  const {
    appConfig,
    body: { password, username },
  } = req;
  
  if (!password || !username) {
    const msg = `Looks like you're missing some data.\n  Username: "${username}"\n  Password: "${password}"`;
    log.error(msg);
    return res.error(400, msg);
  }
  
  const [
    { valueHex: encryptedUsername },
    { combined: encryptedUserData },
    users,
  ] = await Promise.all([
    encrypt(appConfig, username),
    encrypt(appConfig, { password, username }, password),
    loadUsers(),
  ]);
  
  if (users[encryptedUsername]) {
    const msg = `User "${username}" already exists`;
    log.error(msg);
    return res.error(405, msg);
  }
  
  try {
    users[encryptedUsername] = encryptedUserData;
    await writeFile(PATH__USERS, JSON.stringify(users, null, 2), 'utf8');
    
    const message = `Created User for "${username}"`;
    log.info(message);
    res.json({ message });
  }
  catch (err) {
    const msg = `Failed to write file while creating User | ${err}`;
    log.error(msg);
    res.error(500, msg);
  }
}

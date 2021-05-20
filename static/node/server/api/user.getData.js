const log = require('../../utils/logger')('api.user.getData');
const decrypt = require('../utils/decrypt');
const encrypt = require('../utils/encrypt');
const getUserDataPath = require('../utils/getUserDataPath');
const loadUserData = require('../utils/loadUserData');

module.exports = async function getData(req, res) {
  const {
    appConfig,
    body: { password, username },
  } = req;
  
  try {
    const { valueHex: encryptedUsername } = await encrypt(appConfig, username);
    const filePath = getUserDataPath(encryptedUsername);
    const userData = await loadUserData(filePath);
    const decryptedData = userData
      ? await decrypt(appConfig, userData, password)
      : userData;
    
    log.info(`Got data: \n"${decryptedData}"`);
    res.sendJSON({ data: decryptedData });
  }
  catch(err) {
    const msg = `Error getting data\n${err.stack}`;
    log.error(msg);
    res.sendError(500, msg);
  }
}
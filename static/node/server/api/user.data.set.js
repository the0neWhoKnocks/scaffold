const { writeFile } = require('node:fs');
const log = require('../../utils/logger')('api.user.data.set');
const encrypt = require('../utils/encrypt');
const getUserDataPath = require('../utils/getUserDataPath');

module.exports = async function setData(req, res) {
  const {
    appConfig,
    body: { data, password, username },
  } = req;
  
  const { valueHex: encryptedUsername } = await encrypt(appConfig, username);
  const filePath = getUserDataPath(encryptedUsername);
  const { combined: encryptedData } = (await encrypt(appConfig, data, password));
  
  writeFile(filePath, JSON.stringify(encryptedData, null, 2), 'utf8', (err) => {
    if (err) {
      const msg = `Error writing data to "${filePath}"\n${err.stack}`;
      log.error(msg);
      return res.error(500, msg);
    }
    
    log.info(`Set data:\n${encryptedData}`);
    res.json({ message: 'Data set' });
  });
}

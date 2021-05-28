const { existsSync, rename, writeFile } = require('fs');
const { PATH__USERS } = require('../../constants');
const log = require('../../utils/logger')('api.user.profile.set');
const decrypt = require('../utils/decrypt');
const encrypt = require('../utils/encrypt');
const getUserDataPath = require('../utils/getUserDataPath');
const loadUsers = require('../utils/loadUsers');
const loadUserData = require('../utils/loadUserData');

module.exports = async function setProfile(req, res) {
  try {
    const {
      appConfig,
      body: { oldPassword, oldUsername, password, username },
    } = req;
    const { valueHex: encryptedOldUsername } = (await encrypt(appConfig, oldUsername));
    const { valueHex: encryptedNewUsername } = (await encrypt(appConfig, username));
    const oldDataPath = getUserDataPath(encryptedOldUsername);
    const users = await loadUsers();
    const pending = [];
    const PASSWORD = (password !== oldPassword) ? password : oldPassword;
    const USERNAME = (username !== oldUsername) ? username : oldUsername;
    const CURRENT_DATA_PATH = (username !== oldUsername)
      ? getUserDataPath(encryptedNewUsername)
      : oldDataPath;
    let pendingReEncryption = Promise.resolve();
    
    if (
      (username !== oldUsername)
      && users[encryptedNewUsername]
    ) {
      const msg = `User "${username}" already exists`;
      log.error(msg);
      return res.sendError(405, msg);
    }
    
    let encryptedUserData = users[encryptedOldUsername];
    const decryptedUserData = JSON.parse(await decrypt(appConfig, encryptedUserData, oldPassword));
    
    // update Users's data
    if (username !== oldUsername) decryptedUserData.username = username;
    if (password !== oldPassword) decryptedUserData.password = password;
    encryptedUserData = (await encrypt(appConfig, decryptedUserData, PASSWORD)).combined;
    users[encryptedOldUsername] = encryptedUserData;
    
    // change the User's key in users.json
    if (username !== oldUsername) {
      users[encryptedNewUsername] = encryptedUserData;
      delete users[encryptedOldUsername];
    }
    
    pending.push(
      new Promise((resolve, reject) => {
        writeFile(PATH__USERS, JSON.stringify(users, null, 2), 'utf8', (err) => {
          if (err) {
            const msg = `Failed to update "${PATH__USERS}"\n${err.stack}`;
            log.error(msg);
            return reject(msg);
          }
          
          log.info(`Updated "${PATH__USERS}"`);
          resolve();
        });
      })
    );
    
    if (password !== oldPassword) {
      const loadedData = await loadUserData(oldDataPath);
      const decryptedData = await decrypt(appConfig, loadedData, oldPassword);
      pendingReEncryption = encrypt(appConfig, decryptedData, password)
        .then(({ combined }) => new Promise((resolve, reject) => {
          writeFile(oldDataPath, JSON.stringify(combined, null, 2), 'utf8', (err) => {
            if (err) {
              const msg = `Failed to write "${oldDataPath}"\n${err.stack}`;
              log.error(msg);
              return reject(msg);
            }
            
            log.info(`Updated "${oldDataPath}"`);
            resolve();
          });
        }));
      
      pending.push(pendingReEncryption);
    }
    
    if (
      CURRENT_DATA_PATH !== oldDataPath
      && existsSync(oldDataPath)
    ) {
      const pendingRename = pendingReEncryption.then(() => {
        return new Promise((resolve, reject) => {
          rename(oldDataPath, CURRENT_DATA_PATH, (err) => {
            if (err) {
              const msg = `Failed to rename "${oldDataPath}" to "${CURRENT_DATA_PATH}"\n${err.stack}`;
              log.error(msg);
              return reject(msg);
            }
            
            log.info(`Renamed "${oldDataPath}" to "${CURRENT_DATA_PATH}"`);
            resolve();
          });
        });
      });
      
      pending.push(pendingRename);
    }
    
    Promise.all(pending)
      .then(() => {
        res.sendJSON({
          username: USERNAME,
          password: PASSWORD,
        });
      })
      .catch((err) => {
        const msg = `Failed while setting data\n${err.stack}`;
        log.error(msg);
        res.sendError(500, msg);
      });
  }
  catch(err) {
    const msg = `Failed to set profile data \n ${err.stack}`;
    log.error(msg);
    res.sendError(500, msg);
  }
}

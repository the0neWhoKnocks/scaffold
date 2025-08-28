const { rename, writeFile } = require('node:fs/promises');
const { PATH__USERS } = require('../../constants');
const log = require('../../utils/logger')('api.user.profile.set');
const decrypt = require('../utils/decrypt');
const encrypt = require('../utils/encrypt');
const fileExists = require('../utils/fileExists');
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
      return res.error(405, msg);
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
    
    const update = async () => {
      try {
        await writeFile(PATH__USERS, JSON.stringify(users, null, 2), 'utf8');
        log.info(`Updated "${PATH__USERS}"`);
      }
      catch (err) {
        const msg = `Failed to update "${PATH__USERS}"\n${err.stack}`;
        log.error(msg);
        throw new Error(msg);
      }
    };
    pending.push(update());
    
    if (password !== oldPassword) {
      const loadedData = await loadUserData(oldDataPath);
      
      if (loadedData) {
        const decryptedData = await decrypt(appConfig, loadedData, oldPassword);
        const reEncryptData = async () => {
          try {
            const { combined } = await encrypt(appConfig, decryptedData, password);
            await writeFile(oldDataPath, JSON.stringify(combined, null, 2), 'utf8');
            log.info(`Updated "${oldDataPath}"`);
          }
          catch (err) {
            const msg = `Failed to write "${oldDataPath}"\n${err.stack}`;
            log.error(msg);
            throw new Error(msg);
          }
        };
        
        pendingReEncryption = reEncryptData();
        pending.push(pendingReEncryption);
      }
      else log.info('User data empty, skipping re-encryption');
    }
    
    if (
      CURRENT_DATA_PATH !== oldDataPath
      && (await fileExists(oldDataPath))
    ) {
      const pendingRename = pendingReEncryption.then(async () => {
        try {
          await rename(oldDataPath, CURRENT_DATA_PATH);
          log.info(`Renamed "${oldDataPath}" to "${CURRENT_DATA_PATH}"`);
        }
        catch (err) {
          const msg = `Failed to rename "${oldDataPath}" to "${CURRENT_DATA_PATH}"\n${err.stack}`;
          log.error(msg);
          throw new Error(msg);
        }
      });
      
      pending.push(pendingRename);
    }
    
    try {
      await Promise.all(pending);
      res.json({ username: USERNAME, password: PASSWORD });
    }
    catch (err) {
      const msg = `Failed while setting data\n${err.stack}`;
      log.error(msg);
      res.error(500, msg);
    }
  }
  catch (err) {
    const msg = `Failed to set profile data \n ${err.stack}`;
    log.error(msg);
    res.error(500, msg);
  }
};

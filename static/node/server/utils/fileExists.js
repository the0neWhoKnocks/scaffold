const { stat } = require('node:fs/promises');
const log = require('../../utils/logger')('server:utils:fileExists');

module.exports = async function fileExists(filePath, logError = false) {
  try {
    await stat(filePath);
    return true;
  }
  catch (err) {
    if (logError) log.error(err);
    return false;
  }
};

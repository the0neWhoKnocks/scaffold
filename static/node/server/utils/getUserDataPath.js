const { PATH__DATA } = require('../../constants');

module.exports = function getUserDataPath(encryptedUsername) {
  return `${PATH__DATA}/data_${encryptedUsername}.json`;
};

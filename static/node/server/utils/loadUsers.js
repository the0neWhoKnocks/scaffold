const { readFile } = require('node:fs/promises');
const { PATH__USERS } = require('../../constants');
const fileExists = require('./fileExists');

module.exports = async function loadUsers() {
  if ((await fileExists(PATH__USERS))) {
    const users = await readFile(PATH__USERS, 'utf8');
    return JSON.parse(users);
  }
  
  return {};
};

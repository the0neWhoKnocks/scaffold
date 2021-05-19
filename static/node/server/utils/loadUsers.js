const { existsSync, readFile } = require('fs');
const { PATH__USERS } = require('../../constants');

const loadUsers = () => new Promise((resolve, reject) => {
  if (existsSync(PATH__USERS)) {
    readFile(PATH__USERS, 'utf8', (err, users) => {
      if (err) reject(err);
      else resolve(JSON.parse(users));
    });
  }
  else resolve({});
});

module.exports = loadUsers;

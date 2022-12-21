const { existsSync, readFile } = require('node:fs');

module.exports = function loadUserData(filePath) {
  return new Promise((resolve) => {
    if (existsSync(filePath)) {
      readFile(filePath, 'utf8', (err, data) => {
        resolve(JSON.parse(data));
      });
    }
    else resolve('');
  });
}

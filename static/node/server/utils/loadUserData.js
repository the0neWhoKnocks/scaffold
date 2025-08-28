const { readFile } = require('node:fs/promises');
const fileExists = require('./fileExists');

module.exports = async function loadUserData(filePath) {
  if ((await fileExists(filePath))) {
    const data = await readFile(filePath, 'utf8');
    return JSON.parse(data);
  }
  
  return '';
};

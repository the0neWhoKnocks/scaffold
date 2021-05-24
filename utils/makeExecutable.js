const { promises: { access, chmod } } = require('fs');

module.exports = async function makeExecutable(filePath) {
  // https://chmod-calculator.com/
  // perm values
  // - (r)ead = 4
  // - (w)rite = 2
  // - e(x)ecute = 1
  try { await access(filePath, X_OK); }
  catch (err) { await chmod(filePath, '766'); }
}
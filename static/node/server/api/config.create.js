const { writeFile } = require('node:fs');
const { randomBytes } = require('node:crypto');
const {
  CRYPT__LENGTH__BYTES,
  CRYPT__ENCODING,
  PATH__CONFIG,
} = require('../../constants');
const log = require('../../utils/logger')('api.config.create');

module.exports = function createConfig(req, res) {
  if (req.appConfig) return res.error(405, 'Config already exists');
  
  const { cipherKey, salt } = req.body;
  
  if (!cipherKey || !salt) {
    const msg = `Looks like you're missing some data.\n  Cipher Key: "${cipherKey}"\n  Salt: "${salt}"`;
    log.error(msg);
    return res.error(400, msg);
  }
  
  const data = {
    cipherKey,
    iv: randomBytes(CRYPT__LENGTH__BYTES).toString(CRYPT__ENCODING),
    salt,
  };
  writeFile(PATH__CONFIG, JSON.stringify(data, null, 2), 'utf8', (err) => {
    if (err) {
      const msg = `Create Config write failed | ${err}`;
      log.error(msg);
      return res.error(500, msg);
    }
    
    const message = 'Config created';
    log.info(message);
    res.json({ message });
  });
}

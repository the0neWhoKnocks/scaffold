const {
  createDecipheriv,
  scrypt,
} = require('node:crypto');
const {
  CRYPT__ALGORITHM,
  CRYPT__LENGTH__KEY,
  CRYPT__ENCODING,
} = require('../../constants');

module.exports = function decrypt(cryptConfig, valueHex, userPassword) {
  const { cipherKey, iv: configIV, salt } = cryptConfig;
  
  return new Promise((resolve, reject) => {
    const password = userPassword || cipherKey;
    let authTag;
    let iv = configIV;
    let value = valueHex;
    
    try {
      if (userPassword) [authTag, iv, value] = value.split(':');
      
      scrypt(password, salt, CRYPT__LENGTH__KEY, (err, key) => {
        try {
          const _iv = Buffer.from(iv, CRYPT__ENCODING);
          const encrypted = Buffer.from(value, CRYPT__ENCODING);
          const decipher = createDecipheriv(CRYPT__ALGORITHM, key, _iv);
        
          decipher.setAuthTag(Buffer.from(authTag, CRYPT__ENCODING));
          
          const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final(),
          ]);

          resolve(decrypted.toString());
        }
        catch (err) { reject(err); }
      });
    }
    catch (err) { reject(err); }
  });
}

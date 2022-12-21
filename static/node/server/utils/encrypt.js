const {
  createCipheriv,
  randomBytes,
  scrypt,
} = require('node:crypto');
const {
  CRYPT__ALGORITHM,
  CRYPT__LENGTH__BYTES,
  CRYPT__LENGTH__KEY,
  CRYPT__ENCODING,
} = require('../../constants');

module.exports = function encrypt(cryptConfig, value, userPassword) {
  const { cipherKey, iv: configIV, salt } = cryptConfig;
  
  return new Promise((resolve, reject) => {
    const password = userPassword || cipherKey;
    
    try {
      const iv = (userPassword)
        ? Buffer.from(randomBytes(CRYPT__LENGTH__BYTES))
        : Buffer.from(configIV, CRYPT__ENCODING);
      
      scrypt(password, salt, CRYPT__LENGTH__KEY, (err, key) => {
        if (err) return reject(err);
        
        const cipher = createCipheriv(CRYPT__ALGORITHM, key, iv);
        const encryptedData = Buffer.concat([
          cipher.update((typeof value === 'object') ? JSON.stringify(value) : value),
          cipher.final(),
        ]);
        const authTagHex = cipher.getAuthTag().toString(CRYPT__ENCODING);
        const ivHex = iv.toString(CRYPT__ENCODING);
        const valueHex = encryptedData.toString(CRYPT__ENCODING);
        
        resolve({
          authTagHex,
          combined: `${authTagHex}:${ivHex}:${valueHex}`,
          ivHex,
          valueHex,
        });
      });
    }
    catch (err) { reject(err); }
  });
};

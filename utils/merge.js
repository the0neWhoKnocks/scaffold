module.exports = function merge(arr) {
  return arr.reduce((obj, curr) => {
    Object.keys(curr).forEach((key) => {
      const isObj = typeof curr[key] === 'function' || typeof curr[key] === 'object' && curr[key] !== null;
      if (isObj) {
        if (obj[key] === undefined) obj[key] = {};
        obj[key] = { ...obj[key], ...curr[key] };
      }
      else obj[key] = curr[key];
    });
    return obj;
  }, {});
}

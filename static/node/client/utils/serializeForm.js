/**
 * Allows for assigning a `name` to inputs (like in PHP) and having those names
 * build out a complex Object or Array.
 *
 * @param {HTMLElement} formEl - A Form element from the DOM
 * @returns {Object}
 * @example
 * ```js
 * // If something like the following structure is passed in...
 * const inputs = [
 *   { name: 'key', value: 'str' },
 *   { name: 'changes[test][]', value: 'fu' },
 *   { name: 'changes[test][1][blah]', value: 'bar'},
 *   { name: 'changes[test][1][zip]', value: 'zip' },
 *   { name: 'changes[test][]', value: 'bazz' },
 *   { name: 'user[][1][name]', value: 'User' },
 * ];
 * // ... you'll end up with this:
 * // {
 * //   "key": "str",
 * //   "changes": {
 * //     "test": [
 * //       "fu",
 * //       { "blah": "bar", "zip": "zip" },
 * //       "bazz",
 * //     ],
 * //   },
 * //   "user": [
 * //     [
 * //       <empty>,
 * //       { "name": "User" },
 * //     ],
 * //   ],
 * // }
 * ```
 */
module.exports = function serializeForm(formEl) {
  const formData = Object.fromEntries(new FormData(formEl));
  const inputData = Object.keys(formData).map(name => ({ name, value: formData[name] }));
  const serialized = {};
  
  inputData.forEach(({ name, value }) => {
    const rootKey = name.match(/[^[]+/)[0];
    const keys = (name.match(/(\[[^\]]+\]|\[\])/g) || []).map((rawKey) => {
      const key = rawKey.replace(/(\[|\])/g, '');
      const isNum = !isNaN(+key);
      return { isNum, key, rawKey };
    });
  
    if (keys.length) {
      if (!serialized[rootKey]) serialized[rootKey] = (keys[0].isNum) ? [] : {};
      let ref = serialized[rootKey];
  
      keys.forEach(({ isNum, key }, ndx) => {
        const nextObj = keys[ndx + 1];
  
        if (isNum) {
          if (nextObj) {
            if (nextObj.isNum) {
              ref[+key] = ref[+key] || [];
              ref = ref[+key];
            }
            else {
              ref[+key] = ref[+key] || {};
              ref = ref[+key];
            }
          }
          else {
            if (key !== '') ref[+key] = value;
            else ref.push(value);
          }
        }
        else {
          if (!nextObj) ref[key] = value;
          else if (!ref[key]) ref[key] = (nextObj && !nextObj.isNum) ? {} : [];
          ref = ref[key];
        }
      });
    }
    else {
      serialized[rootKey] = value;
    }
  });
  
  return serialized;
}

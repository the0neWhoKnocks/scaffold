module.exports = function sortObj(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((sorted, prop) => { sorted[prop] = obj[prop]; return sorted; }, {});
}

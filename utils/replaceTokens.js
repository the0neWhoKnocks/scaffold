module.exports = function replaceTokens(src, tokens = []) {
  let _src = src;
  
  tokens.forEach(({ remove, replacement, token }) => {
    if (replacement) {
      _src = _src.replace(new RegExp(`\/\/\{TOKEN:#${token}\}`), replacement);
    }
    else {
      const regToken = `(?:\\s+)?\/\/\{TOKEN:(?:\\^|\\$)${token}\}\\n`;
      const reg = new RegExp(`${regToken}(?<inner>[\\s\\S]+\\n)(?=${regToken})${regToken}`, 'm');
      const [wrapped, inner] = _src.match(reg);
      _src = _src.replace(wrapped, remove ? '\n' : `\n${inner}`);
    }
  });
  
  return _src;
}

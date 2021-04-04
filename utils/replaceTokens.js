module.exports = function replaceTokens(src, tokens = []) {
  let _src = src;
  
  tokens.forEach(({ remove, replacement, token }) => {
    if (replacement) {
      _src = _src.replace(new RegExp(`\/\/\{TOKEN:#${token}\}`), replacement);
    }
    else {
      const regToken = `(?:^\\s+)?\\/\\/\\{TOKEN:(?:\\^|\\$)${token}\\}\\n`;
      _src = _src.replace(
        new RegExp(`${regToken}(?<inner>[\\s\\S]*?)(?=${regToken})${regToken}`, 'gm'),
        remove ? '' : '$1'
      );
    }
  });
  
  return _src;
}

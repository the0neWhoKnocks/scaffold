module.exports = function replaceTokens(src, tokens = []) {
  const commentStart = '(?:\\/\\/|#|<!--|\\/\\*)';
  const commentEnd = '(?:\\s-->|\\s\\*\\/)?';
  let _src = src;
  
  tokens.forEach(({ remove, replacement, token }) => {
    if (replacement) {
      _src = _src.replace(new RegExp(`${commentStart}TOKEN:#${token}`), replacement);
    }
    else {
      const regToken = `(?:^\\s+)?${commentStart}TOKEN:(?:\\^|\\$)${token}${commentEnd}\\n`;
      _src = _src.replace(
        new RegExp(`${regToken}(?<inner>[\\s\\S]*?)(?=${regToken})${regToken}`, 'gm'),
        remove ? '' : '$1'
      );
    }
  });
  
  return _src;
}

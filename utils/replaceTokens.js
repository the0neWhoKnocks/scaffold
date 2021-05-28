module.exports = function replaceTokens(src, tokens = []) {
  const commentStart = '(?:\\/\\/|#|<!--|\\/\\*\\s)';
  const commentEnd = '(?:\\s-->|\\s\\*\\/)?';
  let _src = src;
  
  tokens.forEach(({ remove, replacement, token }) => {
    if (replacement !== undefined) {
      _src = _src.replace(new RegExp(`${commentStart}TOKEN:#${token}${commentEnd}`, 'g'), replacement);
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

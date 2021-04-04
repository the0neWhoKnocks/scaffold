module.exports = function replaceTokens(src, tokens = []) {
  const comment = '(?:\\/\\/|#)';
  let _src = src;
  
  tokens.forEach(({ remove, replacement, token }) => {
    if (replacement) {
      _src = _src.replace(new RegExp(`${comment}TOKEN:#${token}`), replacement);
    }
    else {
      const regToken = `(?:^\\s+)?${comment}TOKEN:(?:\\^|\\$)${token}\\n`;
      _src = _src.replace(
        new RegExp(`${regToken}(?<inner>[\\s\\S]*?)(?=${regToken})${regToken}`, 'gm'),
        remove ? '' : '$1'
      );
    }
  });
  
  return _src;
}

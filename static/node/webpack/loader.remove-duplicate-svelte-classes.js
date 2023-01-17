module.exports = function removeDuplicateSvelteClasses(source) {
  const SVELTE_RULE_REGEX = /\.svelte-[a-z0-9]+/g;
  const ruleMatches = (source.match(SVELTE_RULE_REGEX) || []);
  const rules = [...(new Set(ruleMatches)).values()];
  const matchedDupes = rules.reduce((arr, rule) => {
    const dupeRuleRegEx = new RegExp(`${rule}${rule}${Array(10).fill(`(?:${rule})?`).join('')}`, 'g');
    const matches = source.match(dupeRuleRegEx);
    
    if (matches) arr.push(...matches);
    
    return arr;
  }, []);
  let newSrc = source;
  
  if (matchedDupes.length) {
    // sort and reverse so that the longer dupe rules get replaced first
    const uniqueDupes = [...(new Set(matchedDupes)).values()].sort().reverse();
    
    uniqueDupes.forEach((dupeRule) => {
      const singleRule = `.${dupeRule.split('.')[1]}`;
      const allDupes = new RegExp(`(?<dupe>${dupeRule.replace(/\./g, '\\.')})(?<extra>[^{]+)?{`, 'g');
      
      [...newSrc.matchAll(allDupes)].reverse().forEach((m) => {
        const { groups: { extra = '' }, index } = m;
        const firstPart = newSrc.substr(0, index);
        const afterDupe = newSrc.substr(index + dupeRule.length, extra.length);
        const lastPart = newSrc.substr(index + dupeRule.length + extra.length, newSrc.length);
        
        // In order to maintain source maps, insert blank whitespace before the
        // starting brace. Inserting the space anywhere else could break rules.
        // Not inserting the space causes sourcemaps to point to incorrect rules.
        newSrc = `${firstPart}${singleRule}${afterDupe}${''.padEnd(dupeRule.length - singleRule.length)}${lastPart}`;
      });
    });
    
    // console.log(newSrc);
    // console.log(this.resourcePath);
  }
  
  return newSrc;
}

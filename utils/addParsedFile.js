const { readFileSync, writeFileSync } = require('fs');
const replaceTokens = require('./replaceTokens');

module.exports = ({
  outputRoot,
  srcRoot,
}) => function addParsedFile(
  fileName,
  srcPath,
  outputPath,
  tokens = []
) {
  return new Promise((resolve) => {
    const rawText = readFileSync(`${srcRoot}/${srcPath}/${fileName}`, 'utf8');
    const updatedText = replaceTokens(rawText, tokens);
    writeFileSync(`${outputRoot}/${outputPath}/${fileName}`, updatedText, 'utf8');
    resolve();
  });
}

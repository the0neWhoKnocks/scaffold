const {
  promises: {
    access,
    chmod,
    readFile,
    writeFile,
  },
} = require('fs');
const replaceTokens = require('./replaceTokens');

module.exports = ({
  outputRoot,
  srcRoot,
}) => async function addParsedFile(
  fileName,
  srcPath,
  outputPath,
  tokens = [],
  shouldBeExecutable,
) {
  const rawText = await readFile(`${srcRoot}/${srcPath}/${fileName}`, 'utf8');
  const updatedText = replaceTokens(rawText, tokens);
  const outputFilePath = `${outputRoot}/${outputPath}/${fileName}`;
  await writeFile(outputFilePath, updatedText, 'utf8');
  if (shouldBeExecutable) {
    // https://chmod-calculator.com/
    // perm values
    // - (r)ead = 4
    // - (w)rite = 2
    // - e(x)ecute = 1
    try { await access(outputFilePath, X_OK); }
    catch (err) { await chmod(outputFilePath, '766'); }
  }
}

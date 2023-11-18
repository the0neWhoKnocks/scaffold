const { readFile, writeFile } = require('node:fs/promises');
const makeExecutable = require('./makeExecutable');
const replaceTokens = require('./replaceTokens');

module.exports = ({
  outputRoot,
  srcRoot,
}) => async function addParsedFile(
  fileName,
  srcPath,
  outputPath,
  tokens = [],
  executable,
) {
  const rawText = await readFile(`${srcRoot}/${srcPath}/${fileName}`, 'utf8');
  const updatedText = replaceTokens(rawText, tokens);
  const outputFilePath = `${outputRoot}/${outputPath}/${fileName}`;
  
  await writeFile(outputFilePath, updatedText, 'utf8');
  
  if (executable) await makeExecutable(outputFilePath);
}

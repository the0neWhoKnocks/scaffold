const { copyFile: fsCopyFile } = require('node:fs/promises');
const { basename } = require('node:path');
const makeExecutable = require('./makeExecutable');

module.exports = ({
  outputRoot,
  staticRoot,
}) => async function copyFile(srcFile, outputPath, executable) {
  const _srcFile = `${staticRoot}/${srcFile}`;
  const filename = basename(_srcFile);
  const outputFilePath = `${outputRoot}/${outputPath}/${filename}`;
  
  await fsCopyFile(_srcFile, outputFilePath);
  
  if (executable) await makeExecutable(outputFilePath);
}

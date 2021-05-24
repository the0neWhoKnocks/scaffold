const { promises: { copyFile: fsCopyFile } } = require('fs');
const { basename } = require('path');
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

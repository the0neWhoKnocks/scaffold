const { promises: { copyFile: fsCopyFile } } = require('fs');
const { basename } = require('path');

module.exports = ({
  outputRoot,
  staticRoot,
}) => function copyFile(srcFile, outputPath) {
  const _srcFile = `${staticRoot}/${srcFile}`;
  const filename = basename(_srcFile);
  return () => fsCopyFile(_srcFile, `${outputRoot}${outputPath}/${filename}`);
}

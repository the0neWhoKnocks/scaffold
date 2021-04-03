const { promises: { readdir, stat } } = require('fs');

module.exports = async function getFileList(dirPath, filesArr, subDir) {
  const files = await readdir(dirPath);
  let _filesArr = filesArr || [];
  
  _filesArr.push(`${dirPath}/`);
  
  for (let i=0; i<files.length; i++) {
    const filePath = `${dirPath}/${files[i]}`;
    const f = await stat(filePath);
    const isDir = f.isDirectory();
    if (isDir) await getFileList(filePath, _filesArr, true);
    else _filesArr.push(filePath);
  }
  
  if (!subDir) {
    const padding = '  ';
    _filesArr = _filesArr
      .map((p) => {
        const _p = p.replace(dirPath, '');
        const nested = _p.match(/\//g).length - 1;
        const spaces = Array(nested).fill(padding).join('');
        const parts = _p.split('/');
        const isDir = _p.startsWith('/') && _p.endsWith('/');
        let str;
        
        if (isDir) {
          const f = parts[parts.length - 2];
          const b = f ? '└─ ' : '';
          str = `${b}${f}/`;
        }
        else {
          str = `${padding}├─ ${parts[parts.length - 1]}`;
        }
        return `${spaces}${str}`;
      })
      .join('\n');
  }
  
  return _filesArr;
}

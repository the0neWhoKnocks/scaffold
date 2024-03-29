const { readdir, stat } = require('node:fs/promises');
const { basename, dirname } = require('node:path');

module.exports = async function getFileList(
  { ignore = [], path: dirPath },
  filesArr = [],
  subDir
) {
  const folderPaths = [];
  const filePaths = [];
  const rawPaths = (await readdir(dirPath, { withFileTypes: true }))
    .reduce((obj, currObj) => {
      const { name } = currObj;
      const sep = dirPath.endsWith('/') ? '' : '/';
      const currPath = `${dirPath}${sep}${name}`;
      if (currObj.isDirectory()) obj.folders.push(`${currPath}/`);
      else obj.files.push(currPath);
      return obj;
    }, { files: [], folders: [] });
  let _filesArr = filesArr;
  
  // add folder and it's contents
  for (let i=0; i<rawPaths.folders.length; i++) {
    const currPath = rawPaths.folders[i];
    _filesArr.push(currPath);
    
    if ( new RegExp(`(${ignore.join('|')})`).test(currPath) ) {
      _filesArr.push(`${currPath}[ Not Expanded ]`);
    }
    else {
      await getFileList({ ignore, path: currPath }, _filesArr, true);
    }
  }
  // add files
  _filesArr.push(...rawPaths.files);
  
  if (!subDir) {
    _filesArr.unshift(`${dirPath}/`);
    
    const padding = '  ';
    _filesArr = _filesArr
      .map((p, ndx, arr) => {
        const nextP = arr[ndx + 1] || '';
        const _p = p.replace(`${dirPath}/`, '');
        const _nextP = nextP.replace(`${dirPath}/`, '');
        const parts = _p.split('/');
        const isDir = _p.endsWith('/');
        const nested = (_p.match(/\/(?=[^/])/g) || []).length;
        const nextNest = (_nextP.match(/\/(?=[^/])/g) || []).length;
        const indent = Math.max(nested, 0);
        const leadingBranches = Array(indent).fill(`${padding}│`).join('');
        let indentArr = Array(indent ? indent - 1 : indent).fill(padding);
        let lowerDirSpacing = '';
        let str;
        
        if (indent) indentArr = [leadingBranches];
    
        const _f = isDir 
          ? `${parts[parts.length - 2]}/`
          : parts[parts.length - 1];
        const branch = _f && _f !== '/'
          ? (nextNest < nested || !_nextP) ? `${padding}└─ ` : `${padding}├─ `
          : ` ${basename(p)}/`;
        
        if (branch.includes('└─')) lowerDirSpacing = `\n${leadingBranches}`;
          
        return `${indentArr.join('')}${branch}${_f}${lowerDirSpacing}`;
      })
      .join('\n');
  }
  
  return _filesArr;
}

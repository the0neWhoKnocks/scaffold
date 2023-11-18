const { spawn } = require('node:child_process');

const cmd = (cmd, { cwd, shell = 'sh', silent = true } = {}) => new Promise((resolve, reject) => {
  const opts = { cwd };
  const child = spawn(shell, ['-c', cmd], opts);
  let stdout = '';
  let stderr = '';
  
  child.stdout.on('data', (data) => {
    const out = data.toString();
    if (!silent) process.stdout.write(out);
    stdout += out;
  });
  
  child.stderr.on('data', (data) => {
    const err = data.toString();
    if (!silent) process.stdout.write(err);
    stderr += err;
  });
  
  child.on('close', async (statusCode) => {
    if (statusCode === 0) {
      resolve( stdout.split('\n').filter(line => !!line.trim()).join('\n') );
    }
    else {
      const errMsg = (stderr) ? `:\n${stderr}` : '';
      reject(`Command "${cmd}" failed with code "${statusCode}"${errMsg}`);
    }
  });
});
module.exports = cmd;

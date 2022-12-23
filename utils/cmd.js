const cmd = (cmd, { cwd, onError, shell = 'sh', silent = true } = {}) => new Promise((resolve, reject) => {
  const { spawn } = require('child_process');
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
    if (statusCode === 0) resolve(
      stdout
        .split('\n')
        .filter(line => !!line.trim())
        .join('\n')
    );
    else {
      if (onError) {
        if (onError.constructor.name === 'AsyncFunction') await onError(stderr);
        else onError(stderr);
      }
      reject(`Command "${cmd}" failed\n${stderr}`);
      process.exit(statusCode);
    }
  });
});
module.exports = cmd;

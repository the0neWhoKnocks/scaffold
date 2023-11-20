const { mkdirp } = require('mkdirp');
const cmd = require('../utils/cmd');

(async function run() {
  const BASE_DIR = './.ignore';
  
  await mkdirp(BASE_DIR);
  await cmd(`find "${BASE_DIR}" -mindepth 1 -maxdepth 1 -exec rm -rf {} \\;`, { silent: false });
  
  const runScaffold = (args, dir) => {
    const _args = args.split('\n').map(l => l.trim()).join(' ');
    return cmd(`source "${__dirname}/scaffold.sh" && scaffold ${_args}`, { cwd: dir, shell: process.env.SHELL, silent: false });
  };
  
  const findTokens = async (dir) => {
    // returns list of files with tokens
    try { return await cmd(`grep -r "TOKEN:" "${dir}"`); }
    // fails when nothing found
    catch (err) { return ''; }
  };
  
  // -----------------
  // Available flags:
  // -----------------
  // --skip-update-check
  // --remove-previous-scaffold
  // --add-server
  // --server-framework
  // --server-options.api-enabled
  // --server-options.external-requests
  // --server-options.middleware.compression
  // --server-options.middleware.cookies
  // --server-options.middleware.static-files
  // --server-options.multi-user
  // --server-options.secure
  // --server-options.v-host
  // --server-options.web-socket
  // --add-client
  // --client-framework
  // --bundler
  // --dev-options.dotenv
  // --dev-options.e2e-tests
  // --dev-options.logger
  // --dev-options.eslint
  // --dev-options.has-watcher
  // --app-title
  // --logger-namespace
  // --storage-namespace
  // --container-platform
  // --docker.username
  // --deployment-options.gh-page
  
  const cases = [
    {
      dir: `${BASE_DIR}/bare-bones`,
      args: `
        --testing
        --skip-update-check
        --remove-previous-scaffold
        --add-server
        --server-framework "node"
        --no-server-options.api-enabled
        --add-client
        --client-framework "none"
        --bundler "none"
        --no-dev-options.logger
        --no-dev-options.eslint
        --no-dev-options.has-watcher
        --app-title "Bare Bones"
        --logger-namespace "bb"
        --container-platform "none"
        --no-deployment-options.gh-page
      `,
    },
    {
      dir: `${BASE_DIR}/kitchen-sink`,
      args: `
        --testing
        --skip-update-check
        --remove-previous-scaffold
        --add-server
        --server-framework "express"
        --server-options.api-enabled
        --server-options.external-requests
        --server-options.middleware.compression
        --server-options.middleware.cookies
        --server-options.middleware.static-files
        --server-options.multi-user
        --server-options.secure
        --server-options.web-socket
        --add-client
        --client-framework "svelte"
        --bundler "webpack"
        --dev-options.dotenv
        --dev-options.e2e-tests
        --dev-options.eslint
        --dev-options.has-watcher
        --dev-options.logger
        --app-title "Kitchen Sink"
        --logger-namespace "sink"
        --storage-namespace "sink"
        --container-platform "docker"
        --docker.username "fakeDockerUser"
        --deployment-options.gh-page
      `,
    },
  ];
  
  for (const { args, dir } of cases) {
    console.log('\n====================================');
    console.log(`= [Create] "${dir}"`);
    console.log('====================================\n');
    
    await mkdirp(dir);
    await runScaffold(args, dir);
    const tokens = await findTokens(dir);
    
    if (tokens) {
      console.error(`[ERROR] Unprocessed tokens found in files:\n${tokens}`);
      process.exit(1);
    }
  }
})();

const {
  existsSync,
  writeFileSync,
} = require('node:fs');
const { basename, dirname, resolve } = require('node:path');
const chalk = require('chalk');
const { mkdirp } = require('mkdirp');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const cmd = require('./utils/cmd');
const getFileList = require('./utils/getFileList');
const kebabCase = require('./utils/kebabCase');
const merge = require('./utils/merge');
const sortObj = require('./utils/sortObj');
const {
  cliOpts,
  projectType,
  scaffoldQuestions,
  updateQuestions,
} = require('./cliOpts');

const { argv: { skipUpdateCheck, ...rawCLIVals } } = yargs(hideBin(process.argv)).options(cliOpts);
const cliAnswers = Object.entries(rawCLIVals).reduce((obj, [ key, val ]) => {
  if (key !== '_' && key !== '$0' && !key.includes('-')) {
    obj[key] = val;
  }
  return obj;
}, {});
const testing = cliAnswers.testing;

const [ , PATH__SOURCE_SCRIPT ] = process.argv;
const [ PATH__PROJECT_ROOT ] = rawCLIVals._;
const PATH__SOURCE_ROOT = dirname(PATH__SOURCE_SCRIPT);
const addParsedFile = require('./utils/addParsedFile')({
  outputRoot: PATH__PROJECT_ROOT,
  srcRoot: `${PATH__SOURCE_ROOT}/static`,
});
const copyFile = require('./utils/copyFile')({
  outputRoot: PATH__PROJECT_ROOT,
  staticRoot: `${PATH__SOURCE_ROOT}/static`,
});

const GLOBS__DELETE_FILES = [
  '**/*',
  '!.git',
  '!certs.*',
  '!certs.*/**',
  '!LICENSE',
  '!node_modules',
  '!package-lock.json',
  '!yarn.lock',
];
const pendingFileCopies = [];
const pendingFolders = [];
const pendingParsedFiles = [];

function addParsedFiles(items) {
  pendingParsedFiles.push(...items);
}

function copyFiles(items) {
  pendingFileCopies.push(...items);
}

function addFolder(path) {
  pendingFolders.push({ to: path });
}

async function scaffold() {
  // Don't allow within '.git' or 'node_modules' folders
  if (/(\.git|node_modules)$/.test(PATH__PROJECT_ROOT)) {
    console.log([
      "",
      "  [ ERROR ]",
      "",
      `  Looks like you're trying to run the scaffold script within "${basename(PATH__PROJECT_ROOT)}"`,
      "  which is not valid. Try to run in another folder.",
    ].join('\n'));
    process.exit(1);
  }
  // Prevent running the script in it's repo (unless within an ignored directory)
  else if (PATH__PROJECT_ROOT.startsWith(PATH__SOURCE_ROOT)) {
    try {
      await cmd(`git check-ignore "${PATH__PROJECT_ROOT}"`, { cwd: PATH__SOURCE_ROOT });
    }
    catch (err) {
      console.log([
        "",
        "  [ ERROR ]",
        "",
        "  Looks like you're trying to run the scaffold script within it's source",
        "  repo. You have a couple of options:",
        "",
        "  1. Create a new directory outside of this repo and run the script in",
        "     that new folder.",
        "  2. Create a folder in this repo, and add it to the .gitignore file.",
      ].join('\n'));
      process.exit(1);
    }
  }
  
  const { prompt } = require('inquirer');
  
  if (!skipUpdateCheck) {
    // Check for updates before running
    console.log('\n  Checking for updates');
    const repoStatus = await cmd('git fetch && git status -sb', { cwd: PATH__SOURCE_ROOT });
    const behindAhead = repoStatus.split('\n')[0].match(/\[[^\]]+]$/); // get the bracketed content at the end
    // NOTE - The status could be both `ahead` and `behind` if changes to the remote
    // have occurred, and the local repo has committed changes as well.
    if (behindAhead && behindAhead[0].includes('behind')) {
      const { update } = await prompt(updateQuestions);
      
      if (update === 'now') {
        const unCommittedChangesExist = (await cmd('git diff', { cwd: PATH__SOURCE_ROOT }) !== '');
        if (unCommittedChangesExist) {
          console.log('[STASH] changes');
          await cmd('git stash', { cwd: PATH__SOURCE_ROOT });
        }
        
        // rebase
        console.log('[REBASING] from origin/master');
        await cmd('git pull --rebase origin master', { cwd: PATH__SOURCE_ROOT });
        
        if (unCommittedChangesExist) {
          console.log('[UN-STASH] changes');
          await cmd('git stash apply', { cwd: PATH__SOURCE_ROOT });
        }
        
        console.log('Update complete. Re-run script to scaffold project.');
        process.exit();
      }
    }
    else {
      console.log('  No updates\n');
    }
  }
  else {
    console.log('  Skipped update check\n');
  }
  
  const scaffoldAnswers = await prompt(scaffoldQuestions, { PATH__PROJECT_ROOT, ...cliAnswers });
  
  // If there's a Server and a bundler, chances are the User will need the below
  // so ensure it gets added.
  if (
    scaffoldAnswers.addServer
    && scaffoldAnswers.bundler !== 'none'
    && !scaffoldAnswers.serverOptions?.middleware?.staticFiles
  ) {
    if (!scaffoldAnswers.serverOptions) { scaffoldAnswers.serverOptions = {}; }
    if (!scaffoldAnswers.serverOptions?.middleware) { scaffoldAnswers.serverOptions.middleware = {}; }
    scaffoldAnswers.serverOptions.middleware.staticFiles = true;
  }
  
  const {
    addClient,
    addServer,
    appTitle,
    bundler,
    clientFramework,
    deploymentOptions,
    devOptions,
    docker,
    e2eFramework,
    e2eProxy,
    loggerNamespace,
    removePreviousScaffold,
    serverFramework,
    serverOptions,
    storageNamespace,
  } = scaffoldAnswers;
  const {
    ghPage,
  } = (deploymentOptions || {});
  const {
    dotenv,
    eslint,
    hasWatcher,
    logger,
  } = (devOptions || {});
  const {
    apiEnabled,
    externalRequests,
    middleware,
    multiUser,
    secure,
    vHost,
    webSocket,
  } = (serverOptions || {});
  const {
    compression,
    cookies,
    staticFiles,
  } = (middleware || {});
  
  const kebabAppName = kebabCase(appTitle);
  const kebabAppNameDev = `${kebabAppName}-dev`;
  const clientFrameworkIsSvelte = clientFramework === 'svelte';
  const bundlerIsWebpack = bundler === 'webpack';
  const serverFrameworkIsExpress = serverFramework === 'express';
  const serverFrameworkIsNode = serverFramework === 'node';
  const serverFrameworkIsPolka = serverFramework === 'polka';
  const hasServerInteractions = apiEnabled || externalRequests || webSocket || multiUser;
  const sharedDockerTokens = [
    { token: 'DC__APP_NAME', replacement: kebabAppName },
    { token: 'DC__E2E_DEPENDS_ON', replacement: (e2eProxy) ? 'proxied-app' : kebabAppName },
    { token: 'DC__E2E_PROXY', remove: !e2eProxy },
  ];
  
  if (projectType === 'node') {
    if (removePreviousScaffold) {
      const del = require('del');
      const filesToDelete = await del(GLOBS__DELETE_FILES, {
        absolute: true,
        cwd: PATH__PROJECT_ROOT,
        dot: true,
        dryRun: true, // del specific
        onlyFiles: false, // globby specific
        root: PATH__PROJECT_ROOT,
      });
      let list = filesToDelete;
      
      if (cliAnswers.removePreviousScaffold === undefined) {
        const { deleteList } = await prompt({
          message: 'These files will be removed',
          type: 'checkbox',
          name: 'deleteList',
          choices: filesToDelete.map(f => ({
            name: f,
            checked: true,
          }))
        });
        list = deleteList;
      }
      
      await del(list, { cwd: PATH__PROJECT_ROOT });
    }
    
    const packageJSON = {
      scripts: {
        build: './bin/prep-dist.sh',
        start: 'node ./dist/server',
        'start:dev': './bin/prep-dist.sh'
      },
      engines: {
        node: '>=24.1.0',
      },
      dependencies: {},
      devDependencies: {},
    };
    if (bundler) {
      if (bundlerIsWebpack) {
        packageJSON.scripts.build += ' && NODE_ENV=production webpack';
        packageJSON.scripts['start:dev'] += ' && webpack';
      }
      
      packageJSON.scripts['start:dev'] += ' &'; // run bundler and next step in parallel
    }
    else {
      packageJSON.scripts['start:dev'] += ' &&'; // wait for previous step, then execute next step
    }
    if (hasWatcher) {
      // `--no-deprecation` to silence deprecation in BrowserSync's `http-proxy` usage.
      packageJSON.scripts['start:dev'] += ' NODE_OPTIONS=\'--no-deprecation\' ./watcher.js "./bin/prep-dist.sh" "./dist/public/manifest.json"';
    }
    else {
      // NOTE: If it's gotten to this point, not really certain a `start:dev` would be neccessary since a User could just run `build && start`.
      packageJSON.scripts['start:dev'] += ' node ./dist/server';
    }
    
    if (addServer) {
      if (serverFrameworkIsPolka) {
        packageJSON.dependencies['polka'] = '1.0.0-next.28';
      }
      else if (serverFrameworkIsExpress) {
        packageJSON.dependencies['express'] = '4.17.1';
      }
      
      if (compression) packageJSON.dependencies['compression'] = '1.8.0';
      if (cookies) packageJSON.dependencies['cookie-parser'] = '1.4.5';
      if (staticFiles) packageJSON.dependencies['sirv'] = '3.0.1';
      
      const fsDeps = ['readFileSync'];
      if (multiUser) fsDeps.push('existsSync');
      addParsedFiles([
        {
          file: 'index.js',
          from: 'node/server',
          to: 'src/server',
          tokens: [
            { token: 'SERVER__API', remove: !apiEnabled },
            {
              token: 'SERVER__APP_HANDLER',
              replacement: serverFrameworkIsPolka ? 'app.handler' : 'app',
            },
            { token: 'SERVER__COMPRESS', remove: !compression },
            { token: 'SERVER__COOKIES', remove: !cookies },
            { token: 'SERVER__EXT_API', remove: !externalRequests },
            { token: 'SERVER__FRAMEWORK__EXPRESS', remove: !serverFrameworkIsExpress },
            { token: 'SERVER__FRAMEWORK__NODE', remove: !serverFrameworkIsNode },
            { token: 'SERVER__FRAMEWORK__POLKA', remove: !serverFrameworkIsPolka },
            {
              token: 'SERVER__FS',
              replacement: fsDeps.length
                ? `const { ${[...new Set(fsDeps)].join(', ')} } = require('node:fs');`
                : '',
            },
            { token: 'SERVER__HTTPS', remove: !secure },
            { token: 'SERVER__MIDDLEWARE', remove: !compression && !cookies && !staticFiles },
            { token: 'SERVER__MULTI_USER', remove: !multiUser },
            { token: 'SERVER__NO_VHOST', remove: vHost },
            { token: 'SERVER__STATIC', remove: !staticFiles },
            { token: 'SERVER__VHOST', remove: !vHost },
            { token: 'SERVER__WEBSOCKET', remove: !webSocket },
          ],
        },
        {
          file: 'shell.js',
          from: 'node/server',
          to: 'src/server',
          tokens: [
            { token: 'SHELL__BUNDLER__WEBPACK', remove: !bundlerIsWebpack },
            { token: 'SHELL__HEROKU', remove: true },
            { token: 'SHELL__MULTI_USER', remove: !multiUser },
            { token: 'SHELL__SVELTE', remove: !clientFrameworkIsSvelte },
          ],
        },
      ]);
      
      if (multiUser) {
        packageJSON.dependencies['body-parser'] = '1.20.1';
        packageJSON.dependencies['mkdirp'] = '1.0.4';
        
        copyFiles([
          {
            files: [
              'config.create.js',
              'user.create.js',
              'user.data.get.js',
              'user.data.set.js',
              'user.login.js',
              'user.profile.get.js',
              'user.profile.set.js',
            ],
            from: 'node/server/api',
            to: 'src/server/api',
          },
          {
            files: [
              'decrypt.js',
              'encrypt.js',
              'getUserDataPath.js',
              'loadUserData.js',
              'loadUsers.js',
            ],
            from: 'node/server/utils',
            to: 'src/server/utils',
          },
        ]);
      }
      
      if (webSocket) {
        packageJSON.dependencies['ws'] = '8.18.2';
        
        addParsedFiles([{
          file: 'index.js',
          from: 'node/server/socket',
          to: 'src/server/socket',
          tokens: [
            { token: 'SERVER_SOCKET__VHOST', remove: !vHost },
          ],
        }]);
        copyFiles([
          {
            files: [
              'handleClientConnect.js',
              'handleClientDisconnect.js',
            ],
            from: 'node/server/socket',
            to: 'src/server/socket',
          },
        ]);
      }
    }
    
    if (addClient) {
      if (bundlerIsWebpack) {
        packageJSON.devDependencies['clean-webpack-plugin'] = '4.0.0';
        packageJSON.devDependencies['ignore-emit-webpack-plugin'] = '2.0.6';
        packageJSON.devDependencies['terser-webpack-plugin'] = '5.3.14';
        packageJSON.devDependencies['webpack'] = '5.99.9';
        packageJSON.devDependencies['webpack-cli'] = '6.0.1';
        packageJSON.devDependencies['webpack-manifest-plugin'] = '5.0.1';
        
        if (clientFrameworkIsSvelte) {
          packageJSON.devDependencies['css-loader'] = '7.1.2';
          packageJSON.devDependencies['css-minimizer-webpack-plugin'] = '7.0.2';
          packageJSON.devDependencies['mini-css-extract-plugin'] = '2.9.2';
          packageJSON.devDependencies['svelte-loader'] = '3.2.4';
        }
        
        addParsedFiles([{
          file: 'webpack.config.js',
          from: 'node',
          to: '',
          tokens: [
            { token: 'WP__STATIC', remove: !staticFiles },
            { token: 'WP__SVELTE', remove: !clientFrameworkIsSvelte },
            { token: 'WP__WATCH', remove: !hasWatcher },
          ],
        }]);
      }
      
      if (clientFrameworkIsSvelte) {
        packageJSON.devDependencies['svelte'] = '5.33.14';
        packageJSON.devDependencies['svelte-portal'] = '2.2.0';
        
        addParsedFiles([
          {
            file: 'App.svelte',
            from: 'node/client/svelte/components',
            to: 'src/client/components',
            tokens: [
              { token: 'APP__API', remove: !apiEnabled },
              { token: 'APP__ASYNC_MOUNT', replacement: webSocket ? 'async ' : '' },
              { token: 'APP__EXT_API', remove: !externalRequests },
              { token: 'APP__HAS_CONSTANTS', remove: !apiEnabled && !externalRequests && !multiUser && !webSocket },
              { token: 'APP__MULTI_USER', remove: !multiUser },
              { token: 'APP__SERVER_INTERACTIONS', remove: !hasServerInteractions },
              { token: 'APP__WEB_SOCKET', remove: !webSocket },
            ]
          },
          {
            file: 'index.js',
            from: 'node/client/svelte',
            to: 'src/client',
            tokens: [
              { token: 'CLIENT__MULTI_USER', remove: !multiUser },
              { token: 'CLIENT__NO_MULTI_USER', remove: multiUser },
            ],
          },
        ]);
        
        copyFiles([{
          files: ['svelte.config.js'],
          from: 'node',
          to: '',
        }]);
      }
      
      if (multiUser) {
        copyFiles([
          {
            files: [
              'ConfigDialog.svelte',
              'Dialog.svelte',
              'HRWithText.svelte',
              'Icon.svelte',
              'LabeledInput.svelte',
              'LoginDialog.svelte',
              'UserDataDialog.svelte',
              'UserProfileDialog.svelte',
            ],
            from: 'node/client/svelte/components',
            to: 'src/client/components',
          },
          {
            files: [
              'postData.js',
              'serializeForm.js',
              'storage.js',
            ],
            from: 'node/client/utils',
            to: 'src/client/utils',
          }
        ]);
      }
      
      if (webSocket) {
        addParsedFiles([{
          file: 'socket.js',
          from: 'node/client',
          to: 'src/client',
          tokens: [
            { token: 'CLIENT_SOCKET__VHOST', remove: !vHost },
          ],
        }]);
      }
    }
    
    if (addClient || addServer) {
      const removeEmpty = i => !!i;
      const prepFolders = [
        (addServer) ? './dist/server' : '',
        (addClient)
          ? (staticFiles) ? './dist/public/imgs' : './dist/public'
          : '',
      ];
      const prepServerPaths = [
        './src/constants.js',
        addServer ? './src/server' : '',
        './src/utils',
      ];
      const hasAPI = apiEnabled || multiUser;
      
      if (staticFiles) {
        addFolder('src/static');
      }
      
      addParsedFiles([
        {
          file: 'constants.js',
          from: 'node',
          to: 'src',
          tokens: [
            { token: 'CONST__API', remove: !apiEnabled },
            { token: 'CONST__APP_TITLE', replacement: appTitle },
            { token: 'CONST__EXT_API', remove: !externalRequests },
            { token: 'CONST__HAS_API', remove: !hasAPI },
            { token: 'CONST__SVELTE_MNT', remove: !clientFrameworkIsSvelte },
            { token: 'CONST__LOGGER_NAMESPACE', replacement: loggerNamespace || '--' },
            { token: 'CONST__MULTI_USER', remove: !multiUser },
            { token: 'CONST__SERVER', remove: !addServer },
            { token: 'CONST__STORAGE_NAMESPACE', replacement: storageNamespace || 'app' },
            { token: 'CONST__VHOST', remove: !vHost },
            { token: 'CONST__WEB_SOCKETS', remove: !webSocket },
          ],
        },
        {
          executable: true,
          file: 'prep-dist.sh',
          from: 'node/bin',
          to: 'bin',
          tokens: [
            {
              token: 'PREP__FOLDERS',
              replacement: prepFolders.filter(removeEmpty).join(' '),
            },
            {
              token: 'PREP__SERVER_FILE_PATHS',
              replacement: `${prepServerPaths.filter(removeEmpty).join(' \\\n  ')} \\`,
            },
            { token: 'PREP__STATIC', remove: !staticFiles },
          ],
        }
      ]);
    }
    
    if (docker) {
      packageJSON.scripts.preinstall = 'if [ -z "$IN_CONTAINER" ] || ! $IN_CONTAINER; then echo " [ERROR] Not in Docker\n"; rm -rf node_modules; exit 1; fi';
    }
    
    if (hasWatcher) {
      if (addServer) {
        packageJSON.devDependencies['chokidar'] = '3.6.0'; // NOTE: latest version that still has glob, newer removed glob and could break parts of `watcher.js`
        packageJSON.devDependencies['nodemon'] = '3.1.10';
      }
      
      if (addClient) packageJSON.devDependencies['browser-sync'] = '3.0.4';
      
      addParsedFiles([{
        executable: true,
        file: 'watcher.js',
        from: 'node',
        to: '',
        tokens: [
          { token: 'WATCHER__CLIENT', remove: !addClient },
          { token: 'WATCHER__LOGGER', remove: !logger },
          { token: 'WATCHER__SERVER', remove: !addServer },
          { token: 'WATCHER__SOCKET_DOMAIN', remove: secure }, // seems to break the UI connections (at least when the App is https)
          { token: 'WATCHER__WEB_SOCKET', remove: !webSocket },
        ],
      }]);
    }
    
    addParsedFiles([{
      file: 'logger.js',
      from: 'node/utils',
      to: 'src/utils',
      tokens: [
        { token: 'LOGGER__CUSTOM', remove: !logger },
        { token: 'LOGGER__DEFAULT', remove: logger },
      ],
    }]);
    if (logger) {
      let moduleVersion;

      switch(logger) {
        case 'ulog': {
          moduleVersion = '2.0.0-beta.19';
          break;
        }
      }
      
      packageJSON.dependencies['anylogger'] = '1.0.11';
      packageJSON.dependencies[logger] = moduleVersion;
    }
    
    if (eslint) {
      packageJSON.devDependencies['eslint'] = '9.28.0';
      packageJSON.devDependencies['eslint-plugin-n'] = '17.19.0';
      packageJSON.devDependencies['globals'] = '16.2.0'; // needed for newer eslint
      
      const lintExts = ['js'];
      const sourceFolders = ['bin', 'src'];
      
      if (clientFrameworkIsSvelte) {
        packageJSON.devDependencies['eslint-plugin-svelte'] = '3.9.1';
        lintExts.push('svelte');
      }
      
      if (e2eFramework) sourceFolders.push('e2e');
      
      packageJSON.scripts['lint'] = `eslint ./*.js "{${sourceFolders.sort().join(',')}}/**/*.{${lintExts.sort().join(',')}}"`;
      
      addParsedFiles([{
        file: 'eslint.config.mjs',
        from: 'node',
        to: '',
        tokens: [
          { token: 'LINT__SVELTE', remove: !clientFrameworkIsSvelte },
        ],
      }]);
    }
    
    if (e2eFramework) {
      packageJSON.scripts['test'] = `./e2e/bin/test-runner.sh --name ${kebabAppName}`;
      packageJSON.scripts['test:watch'] = 'npm run test -- --watch';
      
      copyFiles([
        {
          executable: true,
          files: ['XServer.xlaunch'],
          from: 'node/e2e/bin',
          to: 'e2e/bin',
        },
      ]);
      
      addParsedFiles([
        {
          executable: true,
          file: 'test-runner.sh',
          from: 'node/e2e/bin',
          to: 'e2e/bin',
          tokens: [
            { token: 'TEST_RUNNER__E2E_NAME', replacement: `${kebabAppName}-e2e` },
            { token: 'TEST_RUNNER__FRAMEWORK__PLAYWRIGHT', remove: e2eFramework !== 'playwright' },
            { token: 'TEST_RUNNER__PROTOCOL', replacement: (secure) ? 'https' : 'http' },
            { token: 'TEST_RUNNER__PROXY', remove: !e2eProxy },
            { token: 'TEST_RUNNER__PROXY_SERVICE_REF', replacement: (e2eProxy) ? '${PROXY_SERVICE}' : '' },
          ],
        },
      ]);
      
      const testTokens = [
        { token: 'TEST__API', remove: !apiEnabled },
        { token: 'TEST__EXT_API', remove: !externalRequests },
        { token: 'TEST__MULTI_USER', remove: !multiUser },
        { token: 'TEST__PROTOCOL', replacement: (secure) ? 'https' : 'http' },
        { token: 'TEST__PROXY', remove: !e2eProxy },
        { token: 'TEST__REQUESTS', remove: !apiEnabled && !externalRequests },
        { token: 'TEST__SERVER_INTERACTIONS', remove: !hasServerInteractions },
      ];
      
      switch (e2eFramework) {
        case 'playwright':
          packageJSON.devDependencies['eslint-plugin-playwright'] = '1.7.0';
          
          addParsedFiles([
            {
              file: 'AppFixture.js',
              from: 'node/e2e/playwright/tests/fixtures',
              to: 'e2e/tests/fixtures',
              tokens: testTokens,
            },
            {
              file: 'docker-compose.yml',
              from: 'node/e2e/playwright',
              to: 'e2e',
              tokens: [
                ...sharedDockerTokens,
                { token: 'DC__EXT_APP_NAME', replacement: (e2eProxy) ? 'proxied-app' : kebabAppName },
                { token: 'DC__PROTOCOL', replacement: (secure) ? 'https' : 'http' },
                { token: 'DC__SECURE', remove: !secure },
              ],
            },
          ]);
          copyFiles([
            {
              files: [
                '.gitignore',
                'Dockerfile',
                'eslint.config.mjs',
                'playwright.config.js',
                'seccomp_profile.json',
              ],
              from: 'node/e2e/playwright',
              to: 'e2e',
            },
          ]);
          
          break;
      }
      
      addParsedFiles([
        {
          file: 'app.test.js',
          from: `node/e2e/${e2eFramework}/tests`,
          to: 'e2e/tests',
          tokens: testTokens,
        },
      ]);
      
      if (e2eProxy) {
        addFolder(`e2e/proxy_cache`);
        
        copyFiles([
          {
            files: ['matcher.js'],
            from: 'node/e2e/proxy',
            to: 'proxy',
          },
        ]);
      }
    }
    
    packageJSON.dependencies = sortObj(packageJSON.dependencies);
    packageJSON.devDependencies = sortObj(packageJSON.devDependencies);
    packageJSON.scripts = sortObj(packageJSON.scripts);
    const jsonReplacer = (key, value) => {
      // double quotes are automatically escaped
      if (typeof value === 'string') return value.replace(/\n/g, '\\n');
      return value;
    };
    writeFileSync(`${PATH__PROJECT_ROOT}/package.json`, `${JSON.stringify(packageJSON, jsonReplacer, 2)}\n`, 'utf8');
  }
  
  if (docker) {
    const { username } = docker;
    const addCerts = secure && !vHost;
    const files = [
      {
        file: '.vimrc',
        from: 'docker/.docker',
        to: '.docker',
      },
      {
        file: '.zshrc',
        from: 'docker/.docker',
        to: '.docker',
      },
      {
        file: 'Dockerfile',
        from: 'docker/.docker',
        to: '.docker',
        tokens: [
          { token: 'DOCKER__APP_NAME', replacement: kebabAppName },
          { token: 'DOCKER__CLIENT', remove: !addClient },
          { token: 'DOCKER__CLIENT_OR_SERVER', remove: !addClient && !addServer },
          { token: 'DOCKER__SERVER', remove: !addServer },
          { token: 'DOCKER__WEBPACK', remove: !bundlerIsWebpack },
        ],
      },
      {
        file: 'zsh-autosuggestions.zsh',
        from: 'docker/.docker',
        to: '.docker',
      },
      {
        executable: true,
        file: 'repo-funcs.sh',
        from: 'docker/bin',
        to: 'bin',
        tokens: [
          { token: 'REPOFUNCS__APP_NAME_DEV', replacement: kebabAppNameDev },
          { token: 'REPOFUNCS__DOTENV', remove: !dotenv },
          { token: 'REPOFUNCS__SECURE', remove: !secure },
        ],
      },
      {
        file: 'docker-compose.yml',
        from: 'docker',
        to: '',
        tokens: [
          ...sharedDockerTokens,
          { token: 'DC__BSYNC', remove: !(hasWatcher && addClient) },
          { token: 'DC__DEV_APP_NAME', replacement: kebabAppNameDev },
          { token: 'DC__E2E_PROXY_PORT', replacement: (secure) ? 443 : 80 },
          { token: 'DC__NODE_CERTS', remove: !addCerts },
          { token: 'DC__PORTS', remove: vHost },
          { token: 'DC__USERNAME', replacement: username },
          { token: 'DC__VHOST', remove: !vHost },
          { token: 'DC__VHOST_NON_SECURE', remove: secure },
          { token: 'DC__VHOST_SECURE', remove: !secure },
          { token: 'DC__WEB_SOCKET', remove: !webSocket },
        ],
      },
    ];
    
    if (vHost) {
      files.push({
        file: '.env',
        from: 'docker',
        to: '',
        tokens: [
          { token: 'ENV__VHOST_DOMAIN', replacement: `${kebabAppName}.local` },
        ],
      });
    }
    
    addParsedFiles(files);
  }
  
  if (ghPage) {
    copyFiles([{
      files: ['gh-pages.yml'],
      from: '.github/workflows',
      to: '.github/workflows',
    }]);
  }
  
  let dcCmd = kebabAppName;
  if (!secure && vHost) dcCmd = '';
  
  addParsedFiles([
    {
      file: '.gitignore',
      from: '',
      to: '',
      tokens: [
        { token: 'IGNORE__DOTENV', remove: !dotenv },
        { token: 'IGNORE__HTTPS', remove: !secure },
        { token: 'IGNORE__VHOST', remove: !vHost },
      ],
    },
    {
      file: 'README.md',
      from: '',
      to: '',
      tokens: [
        { token: 'README__DC_CMD', replacement: dcCmd },
        { token: 'README__DOCKER', remove: !docker },
        { token: 'README__E2E', remove: !e2eFramework },
        { token: 'README__GH_PAGE', remove: !ghPage },
        { token: 'README__HTTPS', remove: !secure },
        { token: 'README__LOGGING', remove: !logger },
        { token: 'README__TITLE', replacement: appTitle },
        { token: 'README__VHOST', remove: !vHost },
        { token: 'README__VHOST_DOMAIN', replacement: kebabAppName },
      ],
    },
  ]);
  
  const pendingPaths = [
    // get a list of unique paths
    ...new Set([...pendingFileCopies, ...pendingFolders, ...pendingParsedFiles].map(({ to }) => to))
  ]
    .filter(i => !!i) // remove empty items
    .filter((i, n, arr) => { // remove any parent paths that'll be created due to a child path existing 
      const str = arr.join('|');
      return !str.includes(`${i}/`);
    })
    .sort();
  pendingPaths.forEach(path => {
    const absPath = `${PATH__PROJECT_ROOT}/${path}`;
    mkdirp.sync(absPath);
    // console.log(`- Created "${absPath}"`);
  });
  
  const pendingFiles = [
    ...pendingFileCopies.reduce((arr, { executable, files, from, to }) => {
      arr.push(...files.map(file => copyFile(`${from}/${file}`, to, executable)));
      return arr;
    }, []),
    ...pendingParsedFiles.map(({ executable, file, from, to, tokens }) => {
      return addParsedFile(file, from, to, tokens, executable);
    }),
  ];
  
  await Promise.all(pendingFiles);
  
  if (!testing) {
    // will return a list of files with tokens
    try {
      const badFiles = await cmd(`grep -r --exclude-dir=node_modules "TOKEN:" "${PATH__PROJECT_ROOT}"`);
      console.log(`\n${chalk.red.inverse(' ERROR ')} Unprocessed tokens found:\n${badFiles}`);
      process.exit(1);
    }
    // fails when nothing found
    catch (err) { /* */ }
  }
  
  if (!existsSync(`${PATH__PROJECT_ROOT}/.git`)) {
    console.log(`\n${chalk.green.inverse(' INIT ')} ${chalk.cyan('git')}`);
    await cmd('git init', { cwd: PATH__PROJECT_ROOT, silent: false });
  }
  
  if (
    !testing
    && projectType === 'node'
    && !docker
    && existsSync(`${PATH__PROJECT_ROOT}/package.json`)
    && !existsSync(`${PATH__PROJECT_ROOT}/node_modules`)
  ) {
    console.log(`\n${chalk.green.inverse(' INSTALL ')} ${chalk.cyan('Node deps')}`);
    await cmd('npm i', { cwd: PATH__PROJECT_ROOT, silent: false });
  }
  
  if (!testing) {
    const fileList = await getFileList({
      ignore: ['.git/', 'node_modules/'],
      path: PATH__PROJECT_ROOT,
    });
    console.log([
      '\n ╭────────╮',
      '\n │ RESULT │',
      '\n─┘        └────────',
      `\n${fileList}`,
    ].join(''));
    
    const addedDockerFuncs = docker && pendingParsedFiles.find(({ file }) => file === 'repo-funcs.sh');
    const listItems = [];
    if (addedDockerFuncs) {
      if (secure) {
        listItems.push(`Read the ${chalk.cyan('Local HTTPS')} section in the ${chalk.cyan('README')} to wire up your certs properly.`);
      }
      else if (!secure && e2eProxy) {
        listItems.push(`In order for E2E requests to be proxied you'll have to add a\n    ${chalk.cyan('certs')} folder at the top of the repo. Generally I'll just\n    symlink a top-level folder I use for all my Apps. If you\n    don't already have some certs lying around, follow the\n    instructions from https://github.com/the0neWhoKnocks/generate-certs`);
      }
      
      listItems.push(
        `Run: ${chalk.cyan('source ./bin/repo-funcs.sh && echo "Loaded: \${REPO_FUNCS}"')}`,
        `Build the Container with: ${chalk.cyan(`docker compose build ${kebabAppName}`)}`,
        `Start the Container with: ${chalk.cyan('startcont')}`,
        `Install Dev dependencies with: ${chalk.cyan('npm i')}`,
      );
    }
    
    listItems.push(
      `Start the App with: ${chalk.cyan('nr start:dev')}`,
    );
    
    console.log(`\n${chalk.green.inverse(' TODO ')} ${chalk.cyan('The rest is up to you')}`);
    console.log(`\nChecklist:\n${listItems.map(str => `  - ${str}\n`).join('')}`);
  }
}

scaffold();

const {
  existsSync,
  writeFileSync,
} = require('fs');
const { dirname, resolve } = require('path');
const mkdirp = require('mkdirp');
const [
  nodeBinary,
  PATH__SOURCE_SCRIPT,
  PATH__PROJECT_ROOT,
] = process.argv;
const PATH__SOURCE_ROOT = dirname(PATH__SOURCE_SCRIPT);
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

// Prevent running the script in it's repo
if (PATH__PROJECT_ROOT.startsWith(PATH__SOURCE_ROOT)) {
  console.log([
    "",
    "  [ ERROR ]",
    "",
    "  Looks like you're trying to run the scaffold script within it's source",
    "  directory. You'll want to create a new directory and run the script in",
    "  that new folder.",
  ].join('\n'));
  process.exit(0);
}

const addParsedFile = require('./utils/addParsedFile')({
  outputRoot: PATH__PROJECT_ROOT,
  srcRoot: `${PATH__SOURCE_ROOT}/static`,
});
const kebabCase = require('./utils/kebabCase');
const merge = require('./utils/merge');
const sortObj = require('./utils/sortObj');
const getFileList = require('./utils/getFileList');
const copyFile = require('./utils/copyFile')({
  outputRoot: PATH__PROJECT_ROOT,
  staticRoot: `${PATH__SOURCE_ROOT}/static`,
});
const cmd = require('./utils/cmd');

const pendingParsedFiles = [];
function addParsedFiles(items) {
  pendingParsedFiles.push(...items);
}

const pendingFileCopies = [];
function copyFiles(items) {
  pendingFileCopies.push(...items);
}

async function scaffold() {
  // NOTE - inquirer is very slow to load, so only bring it in when needed
  const { prompt } = require('inquirer');
  
  // Check for updates before running
  console.log('\n  Checking for updates');
  const repoStatus = await cmd('git fetch && git status -sb', { cwd: PATH__SOURCE_ROOT });
  const behindAhead = repoStatus.split('\n')[0].match(/\[[^\]]+]$/); // get the bracketed content at the end
  // NOTE - The status could be both `ahead` and `behind` if changes to the remote
  // have occurred, and the local repo has committed changes as well.
  if (behindAhead && behindAhead[0].includes('behind')) {
    const { update } = await prompt([
      {
        message: 'Update available. Update now?',
        type: 'list',
        name: 'update',
        default: 0,
        choices: [
          { name: 'Yes', value: 'now' },
          { name: 'Later', value: 'later' },
        ],
      },
    ]);
    
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
  
  const deployOpts = ({ addClient }) => {
    return [
      { name: 'GitHub Page', value: { ghPage: true }, checked: false },
    ].filter(({ value: { ghPage } }) => {
      if (!addClient && ghPage) return false;
      return true;
    });
  };
  
  const projectType = 'node';
  const scaffoldOpts = await prompt([
    // {
    //   message: 'Project Type',
    //   type: 'list',
    //   name: 'projectType',
    //   choices: [
    //     { name: 'Node.js', value: 'node' },
    //   ],
    // },
    {
      message: 'Remove previously scaffolded files?',
      type: 'confirm',
      name: 'removePreviousScaffold',
      when: () => {
        let previouslyScaffolded = false;
        
        if (projectType === 'node') previouslyScaffolded = existsSync(`${PATH__PROJECT_ROOT}/src`);
        
        return previouslyScaffolded;
      },
    },
    {
      message: 'Add Server',
      type: 'confirm',
      name: 'addServer',
    },
    {
      message: '  Server Framework',
      type: 'list',
      name: 'serverFramework',
      default: 0,
      when: ({ addServer }) => addServer,
      choices: [
        { name: 'Node', value: 'node' },
        { name: 'Express', value: 'express' },
        { name: 'Polka', value: 'polka' },
      ],
    },
    {
      message: '  Server Options',
      type: 'checkbox',
      name: 'serverOptions',
      when: ({ addServer }) => addServer,
      filter: answers => merge(answers),
      choices: [
        {
          name: 'Will have an API',
          short: 'API',
          value: { apiEnabled: true },
          checked: false,
        },
        {
          name: 'Will make external requests',
          short: 'External Requests',
          value: { externalRequests: true },
          checked: false,
        },
        {
          name: 'Will serve static assets',
          short: '[middleware] Static',
          value: { middleware: { staticFiles: true } },
          checked: false,
        },
        {
          name: 'Should support User accounts',
          short: 'Users',
          value: { multiUser: true },
          checked: false,
        },
        {
          name: 'Should support https',
          short: 'Secure',
          value: { secure: true },
          checked: false,
        },
        {
          name: 'Should support virtual hosts',
          short: 'VHosts',
          value: { vHost: true },
          checked: false,
        },
        {
          name: 'Should support Web Sockets',
          short: 'Web Socket',
          value: { webSocket: true },
          checked: false,
        },
        {
          name: 'Should gzip responses',
          short: '[middleware] GZip',
          value: { middleware: { compression: true } },
          checked: false,
        },
        {
          name: 'Should be able to read/write cookies',
          short: '[middleware] Cookies',
          value: { middleware: { cookies: true } },
          checked: false,
        },
      ],
    },
    {
      message: 'Add Client',
      type: 'confirm',
      name: 'addClient',
    },
    {
      message: '  Client Framework',
      type: 'list',
      name: 'clientFramework',
      when: ({ addClient }) => addClient,
      default: 1,
      choices: [
        { name: 'None', value: 'none' },
        { name: 'Svelte', value: 'svelte' },
      ],
    },
    {
      message: '  Bundler',
      type: 'list',
      name: 'bundler',
      when: ({ addClient }) => addClient,
      choices: ({ clientFramework }) => {
        return [
          { name: 'None', value: 'none' },
          { name: 'Webpack', value: 'webpack' },
          // { name: 'Rollup', value: 'rollup' },
        ].filter(q => {
          if (clientFramework !== 'svelte') return true;
          return clientFramework === 'svelte' && q.value !== 'none';
        });
      },
    },
    {
      message: 'Dev Options',
      type: 'checkbox',
      name: 'devOptions',
      when: ({ addClient, addServer }) => addClient || addServer,
      filter: answers => merge(answers),
      choices: [
        { name: 'Add e2e tests', value: { e2eTests: true }, checked: false },
        { name: 'Add logging util', value: { logger: 'ulog' }, checked: true },
        { name: 'ESLint', value: { eslint: true }, checked: true },
        { name: 'Watch for changes', value: { hasWatcher: true }, checked: true },
      ],
    },
    {
      message: 'App Title',
      type: 'input',
      name: 'appTitle',
      default: 'App',
    },
    {
      message: 'Logger Namespace',
      type: 'input',
      name: 'loggerNamespace',
      default: 'app',
      when: ({ devOptions }) => devOptions && devOptions.logger,
    },
    {
      message: 'Container Platform',
      type: 'list',
      name: 'containerPlatform',
      default: ({
        devOptions: { e2eTests },
        serverOptions: { vHost },
      }) => {
        if (e2eTests || vHost) return 1;
        return 0;
      },
      choices: [
        { name: 'None', value: '' },
        { name: 'Docker', value: 'docker' },
      ],
    },
    {
      message: '  Docker Username',
      type: 'input',
      name: 'docker.username',
      default: 'theonewhoknocks',
      when: ({ containerPlatform }) => containerPlatform === 'docker',
    },
    // {
    //   message: '  Docker Password',
    //   type: 'password',
    //   mask: '*',
    //   name: 'docker.password',
    //   when: ({ containerPlatform }) => containerPlatform === 'docker',
    // },
    {
      message: 'Deployment Options',
      type: 'checkbox',
      name: 'deploymentOptions',
      filter: answers => merge(answers),
      when: answers => !!deployOpts(answers).length,
      choices: answers => deployOpts(answers),
    },
  ]);
  
  const {
    addClient,
    addServer,
    appTitle,
    bundler,
    clientFramework,
    deploymentOptions,
    devOptions,
    docker,
    loggerNamespace,
    removePreviousScaffold,
    serverFramework,
    serverOptions,
  } = scaffoldOpts;
  const {
    ghPage,
  } = (deploymentOptions || {});
  const {
    e2eTests,
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
  const clientFrameworkIsSvelte = clientFramework === 'svelte';
  const bundlerIsWebpack = bundler === 'webpack';
  const serverFrameworkIsExpress = serverFramework === 'express';
  const serverFrameworkIsNode = serverFramework === 'node';
  const serverFrameworkIsPolka = serverFramework === 'polka';
  const hasServerInteractions = apiEnabled || externalRequests || webSocket || multiUser;
  
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
      const { deleteList } = await prompt({
        message: 'These files will be removed',
        type: 'checkbox',
        name: 'deleteList',
        choices: filesToDelete.map(f => ({
          name: f,
          checked: true,
        }))
      });
      
      await del(deleteList, { cwd: PATH__PROJECT_ROOT });
    }
    
    const packageJSON = {
      scripts: {
        build: './bin/prep-dist.sh && NODE_ENV=production webpack',
        start: 'node ./dist/server',
        'start:dev': './bin/prep-dist.sh && webpack & ./watcher.js "./bin/prep-dist.sh" "./dist/public/manifest.json"'
      },
      dependencies: {},
      devDependencies: {},
    };
    
    if (addServer) {
      if (serverFrameworkIsPolka) {
        packageJSON.dependencies['polka'] = '1.0.0-next.14';
      }
      else if (serverFrameworkIsExpress) {
        packageJSON.dependencies['express'] = '4.17.1';
      }
      
      if (externalRequests) packageJSON.dependencies['teeny-request'] = '7.0.1';
      if (compression) packageJSON.dependencies['compression'] = '1.7.4';
      if (cookies) packageJSON.dependencies['cookie-parser'] = '1.4.5';
      if (staticFiles) packageJSON.dependencies['sirv'] = '1.0.11';
      
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
                ? `const { ${[...new Set(fsDeps)].join(', ')} } = require('fs');`
                : '',
            },
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
        packageJSON.dependencies['body-parser'] = '1.19.0';
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
        packageJSON.dependencies['bufferutil'] = '4.0.3';
        packageJSON.dependencies['supports-color'] = '8.1.1';
        packageJSON.dependencies['ws'] = '7.4.4';
        
        copyFiles([{
          files: ['socket.js'],
          from: 'node/server',
          to: 'src/server',
        }]);
      }
      
      if (secure || vHost) {
        copyFiles([{
          executable: true,
          files: ['gen-certs.sh'],
          from: 'bin',
          to: 'bin',
        }]);
      }
    }
    
    if (addClient) {
      if (bundlerIsWebpack) {
        packageJSON.devDependencies['clean-webpack-plugin'] = '3.0.0';
        packageJSON.devDependencies['ignore-emit-webpack-plugin'] = '2.0.6';
        packageJSON.devDependencies['terser-webpack-plugin'] = '5.1.1';
        packageJSON.devDependencies['webpack'] = '5.31.0';
        packageJSON.devDependencies['webpack-cli'] = '4.6.0';
        packageJSON.devDependencies['webpack-manifest-plugin'] = '3.1.1';
        
        if (clientFrameworkIsSvelte) {
          packageJSON.devDependencies['css-loader'] = '5.2.0';
          packageJSON.devDependencies['css-minimizer-webpack-plugin'] = '1.3.0';
          packageJSON.devDependencies['mini-css-extract-plugin'] = '1.4.1';
          packageJSON.devDependencies['svelte-loader'] = '3.1.0';
        }
        
        addParsedFiles([{
          file: 'webpack.config.js',
          from: 'node',
          to: '',
          tokens: [
            { token: 'WP__SVELTE', remove: !clientFrameworkIsSvelte },
            { token: 'WP__WATCH', remove: !hasWatcher },
          ],
        }]);
      }
      
      if (clientFrameworkIsSvelte) {
        packageJSON.devDependencies['svelte'] = '3.37.0';
        
        addParsedFiles([
          {
            file: 'app.svelte',
            from: 'node/client/svelte',
            to: 'src/client',
            tokens: [
              { token: 'APP__API', remove: !apiEnabled },
              { token: 'APP__EXT_API', remove: !externalRequests },
              { token: 'APP__HAS_CONSTANTS', remove: !multiUser && !webSocket },
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
        copyFiles([{
          files: ['socket.js'],
          from: 'node/client',
          to: 'src/client',
        }]);
      }
    }
    
    if (addClient || addServer) {
      const removeEmpty = i => !!i;
      const prepFolders = [
        addServer ? './dist/server' : '',
        addClient ? './dist/public' : '',
      ];
      const prepServerPaths = [
        './src/constants.js',
        addServer ? './src/server' : '',
        logger ? './src/utils' : '',
      ];
      const hasAPI = apiEnabled || multiUser;
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
            { token: 'CONST__LOGGER_NAMESPACE', remove: !logger },
            { token: 'CONST__LOGGER_NAMESPACE', replacement: loggerNamespace || '--' },
            { token: 'CONST__MULTI_USER', remove: !multiUser },
            { token: 'CONST__SERVER', remove: !addServer },
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
          ],
        }
      ]);
    }
    
    if (hasWatcher) {
      if (addServer) {
        packageJSON.devDependencies['chokidar'] = '3.5.1';
        packageJSON.devDependencies['nodemon'] = '2.0.7';
      }
      
      if (addClient) packageJSON.devDependencies['browser-sync'] = '2.26.14';
      
      addParsedFiles([{
        executable: true,
        file: 'watcher.js',
        from: 'node',
        to: '',
        tokens: [
          { token: 'WATCHER__CLIENT', remove: !addClient },
          { token: 'WATCHER__LOGGER', remove: !logger },
          { token: 'WATCHER__SERVER', remove: !addServer },
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
          // locking at .14 because of https://github.com/Download/ulog/issues/50#issuecomment-806713200
          moduleVersion = '2.0.0-beta.18';
          break;
        }
      }
      
      packageJSON.dependencies['anylogger'] = '1.0.11';
      packageJSON.dependencies[logger] = moduleVersion;
    }
    
    if (eslint) {
      packageJSON.devDependencies['eslint'] = '7.23.0';
      
      if (clientFrameworkIsSvelte) {
        packageJSON.devDependencies['eslint-plugin-svelte3'] = '3.1.2';
      }
      
      addParsedFiles([{
        file: '.eslintrc.js',
        from: 'node',
        to: '',
        tokens: [
          { token: 'LINT__SVELTE', remove: !clientFrameworkIsSvelte },
        ],
      }]);
    }
    
    if (e2eTests) {
      packageJSON.scripts['test'] = './e2e/bin/test-runner.sh';
      packageJSON.scripts['test:watch'] = 'npm run test -- --watch';
      
      copyFiles([
        {
          executable: true,
          files: ['test-runner.sh', 'XServer.xlaunch'],
          from: 'node/e2e/bin',
          to: 'e2e/bin',
        },
        {
          files: ['1x1.png'],
          from: 'node/e2e/cypress/fixtures',
          to: 'e2e/cypress/fixtures',
        },
        {
          files: ['index.js'],
          from: 'node/e2e/cypress/plugins',
          to: 'e2e/cypress/plugins',
        },
        {
          files: ['commands.js', 'index.js'],
          from: 'node/e2e/cypress/support',
          to: 'e2e/cypress/support',
        },
        {
          files: ['.eslintrc.js', 'cypress.json', 'Dockerfile'],
          from: 'node/e2e',
          to: 'e2e',
        },
      ]);
      
      addParsedFiles([{
        file: 'app.test.js',
        from: 'node/e2e/tests',
        to: 'e2e/tests',
        tokens: [
          { token: 'TEST__API', remove: !apiEnabled },
          { token: 'TEST__APP_TITLE', replacement: appTitle },
          { token: 'TEST__EXT_API', remove: !externalRequests },
          { token: 'TEST__MULTI_USER', remove: !multiUser },
          { token: 'TEST__SERVER_INTERACTIONS', remove: !hasServerInteractions },
          { token: 'TEST__WEB_SOCKETS', remove: !webSocket },
        ],
      }]);
    }
    
    packageJSON.dependencies = sortObj(packageJSON.dependencies);
    packageJSON.devDependencies = sortObj(packageJSON.devDependencies);
    packageJSON.scripts = sortObj(packageJSON.scripts);
    writeFileSync(`${PATH__PROJECT_ROOT}/package.json`, `${JSON.stringify(packageJSON, null, 2)}\n`, 'utf8');
  }
  
  if (docker) {
    const { username } = docker;
    const addCerts = secure && !vHost;
    const files = [
      {
        file: 'Dockerfile',
        from: 'docker/.docker',
        to: '.docker',
        tokens: [
          { token: 'DOCKER__APP_NAME', replacement: kebabAppName },
        ],
      },
      {
        file: 'docker-compose.yml',
        from: 'docker',
        to: '',
        tokens: [
          { token: 'DC__APP_NAME', replacement: kebabAppName },
          { token: 'DC__E2E', remove: !e2eTests },
          { token: 'DC__MULTI_USER', remove: !multiUser },
          { token: 'DC__NODE_CERTS', remove: !addCerts },
          { token: 'DC__PORTS', remove: vHost },
          { token: 'DC__USERNAME', replacement: username },
          { token: 'DC__VHOST', remove: !vHost },
          { token: 'DC__VHOST_NON_SECURE', remove: secure },
          { token: 'DC__VHOST_SECURE', remove: !secure },
          { token: 'DC__VOLUMES', remove: !multiUser && !addCerts },
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
  
  addParsedFiles([
    {
      file: '.gitignore',
      from: '',
      to: '',
      tokens: [
        { token: 'IGNORE__E2E', remove: !e2eTests },
        { token: 'IGNORE__HTTPS', remove: !secure },
        { token: 'IGNORE__VHOST', remove: !vHost },
      ],
    },
    {
      file: 'README.md',
      from: '',
      to: '',
      tokens: [
        { token: 'README__DOCKER', remove: !docker },
        { token: 'README__E2E', remove: !e2eTests },
        { token: 'README__GH_PAGE', remove: !ghPage },
        { token: 'README__HTTPS', remove: !secure },
        { token: 'README__LOGGING', remove: !logger },
        { token: 'README__TITLE', replacement: appTitle },
        { token: 'README__VHOST', remove: !vHost },
      ],
    },
  ]);
  
  const pendingPaths = [
    // get a list of unique paths
    ...new Set([...pendingFileCopies, ...pendingParsedFiles].map(({ to }) => to))
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
}

scaffold();

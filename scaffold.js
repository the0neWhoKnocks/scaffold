const {
  existsSync,
  writeFileSync,
} = require('fs');
const { dirname, resolve } = require('path');
const mkdirp = require('mkdirp');
const globby = require('globby');

const [
  nodeBinary,
  PATH__SOURCE_SCRIPT,
  PATH__PROJECT_ROOT,
] = process.argv;
const PATH__SOURCE_ROOT = dirname(PATH__SOURCE_SCRIPT);
const PATTERNS = [
  '**/*',
  '!.git',
  '!LICENSE',
  '!node_modules',
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

const WSL2 = process.env.WSL_INTEROP;
const replaceTokens = require('./utils/replaceTokens');
const addParsedFile = require('./utils/addParsedFile')({
  outputRoot: PATH__PROJECT_ROOT,
  srcRoot: `${PATH__SOURCE_ROOT}/static`,
});
const merge = require('./utils/merge');
const sortObj = require('./utils/sortObj');
const getFileList = require('./utils/getFileList');
const copyFile = require('./utils/copyFile')({
  outputRoot: PATH__PROJECT_ROOT,
  staticRoot: `${PATH__SOURCE_ROOT}/static`,
});
const cmd = require('./utils/cmd');

async function scaffold() {
  // NOTE - inquirer is very slow to load, so only bring it in when needed
  const { prompt } = require('inquirer');
  
  // Check for updates before running
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
        default: 'now',
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
    }
  }
  
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
      message: 'Standards',
      type: 'checkbox',
      name: 'standards',
      filter: answers => answers.reduce((obj, a) => {
        obj[a] = true;
        return obj;
      }, {}),
      choices: [
        { name: 'ESLint', value: 'eslint', checked: true }
      ],
    },
    {
      message: 'Add Server',
      type: 'confirm',
      name: 'addServer',
    },
    {
      message: 'Server Framework',
      type: 'list',
      name: 'serverFramework',
      default: 'polka',
      when: ({ addServer }) => addServer,
      choices: [
        { name: 'Node', value: 'node' },
        { name: 'Express', value: 'express' },
        { name: 'Polka', value: 'polka' },
      ],
    },
    {
      message: 'Server Options',
      type: 'checkbox',
      name: 'serverOptions',
      when: ({ addServer }) => addServer,
      filter: answers => merge(answers),
      choices: [
        {
          name: 'Will have an API?',
          short: 'API endpoint',
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
          name: 'Should support https',
          short: 'Secure',
          value: { secure: true },
          checked: false,
          disabled: true,
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
      message: 'Client Framework',
      type: 'list',
      name: 'clientFramework',
      when: ({ addClient }) => addClient,
      default: 'svelte',
      choices: [
        { name: 'None', value: 'none' },
        { name: 'Svelte', value: 'svelte' },
      ],
    },
    {
      message: 'Bundler',
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
        { name: 'Watch for changes', value: { hasWatcher: true }, checked: true },
        { name: 'Add logging util', value: { logger: 'ulog' }, checked: true },
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
  ]);
  
  const {
    addClient,
    addServer,
    appTitle,
    bundler,
    clientFramework,
    devOptions,
    loggerNamespace,
    removePreviousScaffold,
    serverFramework,
    serverOptions,
    standards,
  } = scaffoldOpts;
  const {
    hasWatcher,
    logger,
  } = (devOptions || {});
  const {
    apiEnabled,
    externalRequests,
    middleware,
    secure,
    webSocket,
  } = (serverOptions || {});
  const {
    compression,
    cookies,
    staticFiles,
  } = (middleware || {});
  
  const clientFrameworkIsSvelte = clientFramework === 'svelte';
  const bundlerIsWebpack = bundler === 'webpack';
  const serverFrameworkIsExpress = serverFramework === 'express';
  const serverFrameworkIsNode = serverFramework === 'node';
  const serverFrameworkIsPolka = serverFramework === 'polka';
  const filesToCopy = [
    copyFile(`.gitignore`, ''),
  ];
  
  if (projectType === 'node') {
    if (removePreviousScaffold) {
      const del = require('del');
      const filesToDelete = await del(PATTERNS, {
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
      mkdirp.sync(`${PATH__PROJECT_ROOT}/src/server`);
      
      if (serverFrameworkIsPolka) {
        packageJSON.devDependencies['polka'] = '1.0.0-next.14';
      }
      else if (serverFrameworkIsExpress) {
        packageJSON.devDependencies['express'] = '4.17.1';
      }
      
      if (externalRequests) packageJSON.dependencies['teeny-request'] = '7.0.1';
      if (compression) packageJSON.dependencies['compression'] = '1.7.4';
      if (cookies) packageJSON.dependencies['cookie-parser'] = '1.4.5';
      if (staticFiles) packageJSON.dependencies['sirv'] = '1.0.11';
      if (webSocket) {
        packageJSON.dependencies['bufferutil'] = '4.0.3';
        packageJSON.dependencies['supports-color'] = '8.1.1';
        packageJSON.dependencies['ws'] = '7.4.4';
      }
      
      await addParsedFile(
        'index.js',
        'node/server',
        'src/server',
        [
          { token: 'SERVER__API', remove: !apiEnabled },
          { token: 'SERVER__APP_HANDLER', replacement: serverFrameworkIsPolka ? 'app.handler' : 'app' },
          { token: 'SERVER__COMPRESS', remove: !compression },
          { token: 'SERVER__COOKIES', remove: !cookies },
          { token: 'SERVER__FRAMEWORK__EXPRESS', remove: !serverFrameworkIsExpress },
          { token: 'SERVER__FRAMEWORK__NODE', remove: !serverFrameworkIsNode },
          { token: 'SERVER__FRAMEWORK__POLKA', remove: !serverFrameworkIsPolka },
          { token: 'SERVER__SECURE', remove: !secure },
          { token: 'SERVER__STATIC', remove: !staticFiles },
          { token: 'SERVER__UNSECURE', remove: secure },
          { token: 'SERVER__WEBSOCKET', remove: !webSocket },
        ]
      );
      await addParsedFile(
        'shell.js',
        'node/server',
        'src/server',
        [
          { token: 'SHELL__BUNDLER__WEBPACK', remove: !bundlerIsWebpack },
          { token: 'SHELL__HEROKU', remove: true },
          { token: 'SHELL__SVELTE', remove: !clientFrameworkIsSvelte },
        ]
      );
      
      if (webSocket) {
        filesToCopy.push(copyFile('node/server/socket.js', `src/server`));
      }
    }
    
    if (addClient) {
      mkdirp.sync(`${PATH__PROJECT_ROOT}/src/client`);
      
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
        
        await addParsedFile(
          'webpack.config.js',
          'node',
          '',
          [
            { token: 'WP__FILE_POLLING', remove: !WSL2 },
            { token: 'WP__SVELTE', remove: !clientFrameworkIsSvelte },
          ]
        );
      }
      
      if (clientFrameworkIsSvelte) {
        packageJSON.devDependencies['svelte'] = '3.37.0';
        
        await addParsedFile(
          'app.svelte',
          'node/client/svelte',
          'src/client',
          [
            { token: 'APP__API', remove: !apiEnabled },
            { token: 'APP__SERVER_INTERACTIONS', remove: !apiEnabled && !webSocket },
            { token: 'APP__WEB_SOCKET', remove: !webSocket },
          ]
        );
        
        filesToCopy.push(
          copyFile('node/client/svelte/index.js', `src/client`),
        );
      }
      
      if (webSocket) {
        filesToCopy.push(copyFile('node/client/socket.js', `src/client`));
      }
    }
    
    if (addClient || addServer) {
      await addParsedFile(
        'constants.js',
        'node',
        'src',
        [
          { token: 'CONST__APP_TITLE', replacement: appTitle },
          { token: 'CONST__SVELTE_MNT', remove: !clientFrameworkIsSvelte },
          { token: 'CONST__LOGGER_NAMESPACE', remove: !logger },
          { token: 'CONST__LOGGER_NAMESPACE', replacement: loggerNamespace || '--' },
          { token: 'CONST__SERVER', remove: !addServer },
          { token: 'CONST__WEB_SOCKETS', remove: !webSocket },
        ]
      );
      
      mkdirp.sync(`${PATH__PROJECT_ROOT}/bin`);
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
      await addParsedFile(
        'prep-dist.sh',
        'node/bin',
        'bin',
        [
          {
            token: 'PREP__FOLDERS',
            replacement: prepFolders.filter(removeEmpty).join(' '),
          },
          {
            token: 'PREP__SERVER_FILE_PATHS',
            replacement: `${prepServerPaths.filter(removeEmpty).join(' \\\n  ')} \\`,
          },
        ],
        true,
      );
    }
    
    if (hasWatcher) {
      if (addServer) {
        packageJSON.devDependencies['chokidar'] = '3.5.1';
        packageJSON.devDependencies['nodemon'] = '2.0.7';
      }
      
      if (addClient) packageJSON.devDependencies['browser-sync'] = '2.26.14';
      
      await addParsedFile(
        'watcher.js',
        'node',
        '',
        [
          { token: 'WATCHER__CLIENT', remove: !addClient },
          { token: 'WATCHER__FILE_POLLING', replacement: WSL2 ? 'true' : 'false' },
          { token: 'WATCHER__LOGGER', remove: !logger },
          { token: 'WATCHER__SERVER', remove: !addServer },
        ],
        true,
      );
    }
    
    mkdirp.sync(`${PATH__PROJECT_ROOT}/src/utils`);
    
    await addParsedFile(
      'logger.js',
      'node/utils',
      'src/utils',
      [
        { token: 'LOGGER__CUSTOM', remove: !logger },
        { token: 'LOGGER__DEFAULT', remove: logger },
      ]
    );
    
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
    
    if (standards.eslint) {
      packageJSON.devDependencies['eslint'] = '7.23.0';
      
      if (clientFrameworkIsSvelte) {
        packageJSON.devDependencies['eslint-plugin-svelte3'] = '3.1.2';
      }
      
      await addParsedFile(
        '.eslintrc.js',
        'node',
        '',
        [
          { token: 'LINT__SVELTE', remove: !clientFrameworkIsSvelte },
        ]
      );
    }
    
    packageJSON.dependencies = sortObj(packageJSON.dependencies);
    packageJSON.devDependencies = sortObj(packageJSON.devDependencies);
    packageJSON.scripts = sortObj(packageJSON.scripts);
    writeFileSync(`${PATH__PROJECT_ROOT}/package.json`, JSON.stringify(packageJSON, null, 2), 'utf8');
  }

  const containerPlatform = 'docker';
  if (containerPlatform === 'docker') {
    // TODO copy over docker stuff
  }
  
  // TODO - add .github/workflows
  
  await addParsedFile(
    'README.md',
    '',
    '',
    [
      { token: 'README__LOGGING', remove: !logger },
      { token: 'README__TITLE', replacement: appTitle },
    ]
  );
  
  await Promise.all(filesToCopy.map(fn => fn()));
  
  const fileList = await getFileList(PATH__PROJECT_ROOT);
  console.log([
    '\n ╭────────╮',
    '\n │ RESULT │',
    '\n─┘        └────────',
    `\n${fileList}`,
  ].join(''));
}

scaffold();

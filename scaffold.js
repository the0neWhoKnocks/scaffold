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

async function scaffold() {
  // NOTE - inquirer is very slow to load, so only bring it in when needed
  const { prompt } = require('inquirer');
  
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
      choices: ({ serverFramework }) => {
        const middlewareDisabled = serverFramework === 'node';
        return [
          {
            name: 'Will make external requests',
            short: 'External Requests',
            value: { externalRequests: true },
            checked: true,
          },
          {
            name: 'Should support Web Sockets',
            short: 'Web Socket',
            value: { webSocket: true },
            checked: true,
          },
          {
            name: 'Should gzip responses',
            short: '[middleware] GZip',
            value: { middleware: { compression: true } },
            checked: true,
            disabled: middlewareDisabled,
          },
          {
            name: 'Should be able to read/write cookies',
            short: '[middleware] Cookies',
            value: { middleware: { cookies: true } },
            checked: true,
            disabled: middlewareDisabled,
          },
          {
            name: 'Will serve static assets',
            short: '[middleware] Static',
            value: { middleware: { staticFiles: true } },
            checked: true,
            disabled: middlewareDisabled,
          },
        ];
      },
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
    serverOptions,
    standards,
  } = scaffoldOpts;
  const {
    hasWatcher,
    logger,
  } = (devOptions || {});
  const {
    externalRequests,
    framework: serverFramework,
    middleware,
    webSocket,
  } = (serverOptions || {});
  const {
    compression,
    cookies,
    staticFiles,
  } = (middleware || {});
  
  const clientFrameworkIsSvelte = clientFramework === 'svelte';
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
      
      switch(serverFramework) {
        case 'express': {
          packageJSON.devDependencies['express'] = '4.17.1';
          break;
        }
        case 'polka': {
          packageJSON.devDependencies['polka'] = '1.0.0-next.13';
          break;
        }
      }
      
      if (externalRequests) packageJSON.dependencies['teeny-request'] = '7.0.1';
      if (compression) packageJSON.dependencies['compression'] = '1.7.1';
      if (cookies) packageJSON.dependencies['cookie-parser'] = '1.4.5';
      if (staticFiles) packageJSON.dependencies['sirv'] = '0.4.0';
      if (webSocket) {
        packageJSON.dependencies['bufferutil'] = '4.0.1';
        packageJSON.dependencies['supports-color'] = '7.2.0';
        packageJSON.dependencies['ws'] = '7.3.1';
      }
      
      // TODO - copy over server
    }
    
    if (addClient) {
      mkdirp.sync(`${PATH__PROJECT_ROOT}/src/client`);
      
      switch(bundler) {
        case 'webpack': {
          packageJSON.devDependencies['clean-webpack-plugin'] = '3.0.0';
          packageJSON.devDependencies['css-loader'] = '4.3.0';
          packageJSON.devDependencies['ignore-emit-webpack-plugin'] = '2.0.3';
          packageJSON.devDependencies['mini-css-extract-plugin'] = '0.12.0';
          packageJSON.devDependencies['optimize-css-assets-webpack-plugin'] = '5.0.4';
          packageJSON.devDependencies['terser-webpack-plugin'] = '4.2.3';
          packageJSON.devDependencies['webpack'] = '4.44.2';
          packageJSON.devDependencies['webpack-cli'] = '3.3.12';
          packageJSON.devDependencies['webpack-manifest-plugin'] = '2.2.0';
          
          if (clientFrameworkIsSvelte) packageJSON.devDependencies['svelte-loader'] = '2.13.6';
          
          await addParsedFile(
            'webpack.config.js',
            'node',
            '',
            [
              { token: 'WP__SVELTE_ALIAS', remove: !clientFrameworkIsSvelte },
              { token: 'WP__SVELTE_EXT', remove: !clientFrameworkIsSvelte },
              { token: 'WP__SVELTE_LOADERS', remove: !clientFrameworkIsSvelte },
              { token: 'WP__SVELTE_MAIN', remove: !clientFrameworkIsSvelte },
              { token: 'WP__SVELTE_MODULES', remove: !clientFrameworkIsSvelte },
              { token: 'WP__SVELTE_PLUGINS', remove: !clientFrameworkIsSvelte },
            ]
          );
        }
      }
      
      if (clientFrameworkIsSvelte) {
        packageJSON.devDependencies['svelte'] = '3.29.0';
        
        filesToCopy.push(copyFile('node/client/svelte/app.js', `src/client`));
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
          { token: 'CONST__WS_MESSAGES', remove: !webSocket },
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
        ]
      );
    }
    
    if (hasWatcher) {
      if (addServer) {
        packageJSON.devDependencies['chokidar'] = '3.5.1';
        packageJSON.devDependencies['nodemon'] = '2.0.4';
      }
      
      if (addClient) packageJSON.devDependencies['browser-sync'] = '2.26.12';
      
      await addParsedFile(
        'watcher.js',
        'node',
        '',
        [
          { token: 'WATCHER__CLIENT', remove: !addClient },
          { token: 'WATCHER__LOGGER', remove: !logger },
          { token: 'WATCHER__SERVER', remove: !addServer },
        ]
      );
    }
    
    if (logger) {
      let moduleVersion;

      switch(logger) {
        case 'ulog': {
          moduleVersion = '2.0.0-beta.18';
          break;
        }
      }
      
      packageJSON.dependencies['anylogger'] = '1.0.10';
      packageJSON.dependencies[logger] = moduleVersion;
      
      mkdirp.sync(`${PATH__PROJECT_ROOT}/src/utils`);
      filesToCopy.push(copyFile('node/utils/logger.js', `src/utils`));
    }
    
    if (standards.eslint) {
      packageJSON.devDependencies['eslint'] = '7.5.0';
      
      if (clientFrameworkIsSvelte) {
        packageJSON.devDependencies['eslint-plugin-svelte3'] = '3.0.0';
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

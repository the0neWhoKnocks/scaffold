const {
  existsSync,
  promises: {
    copyFile
  },
  readFileSync,
  writeFileSync,
} = require('fs');
const { dirname, resolve } = require('path');
const mkdirp = require('mkdirp');
const { prompt } = require('inquirer');

const [
  nodeBinary,
  PATH__SOURCE_SCRIPT,
  PATH__PROJECT_ROOT,
] = process.argv;
const PATH__SOURCE_ROOT = dirname(PATH__SOURCE_SCRIPT);

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

const replaceTokens = (src, tokens = []) => {
  let _src = src;
  
  tokens.forEach(({ remove, replacement, token }) => {
    if (replacement) {
      _src = _src.replace(new RegExp(`\/\/\{TOKEN:#${token}\}`), replacement);
    }
    else {
      const regToken = `(?:\\s+)?\/\/\{TOKEN:(?:\\^|\\$)${token}\}\\n`;
      const reg = new RegExp(`${regToken}(?<inner>[\\s\\S]+\\n)(?=${regToken})${regToken}`, 'm');
      const [wrapped, inner] = _src.match(reg);
      _src = _src.replace(wrapped, remove ? '\n' : `\n${inner}`);
    }
  });
  
  return _src;
};
const addParsedFile = (
  fileName,
  srcPath,
  outputPath,
  tokens = []
) => new Promise((resolve) => {
  const rawText = readFileSync(`${PATH__SOURCE_ROOT}/${srcPath}/${fileName}`, 'utf8');
  const updatedText = replaceTokens(rawText, tokens);
  writeFileSync(`${PATH__PROJECT_ROOT}/${outputPath}/${fileName}`, updatedText, 'utf8');
  resolve();
});

const merge = (arr) => {
  return arr.reduce((obj, curr) => {
    Object.keys(curr).forEach((key) => {
      const isObj = typeof curr[key] === 'function' || typeof curr[key] === 'object' && curr[key] !== null;
      if (isObj) {
        if (obj[key] === undefined) obj[key] = {};
        obj[key] = { ...obj[key], ...curr[key] };
      }
      else obj[key] = curr[key];
    });
    return obj;
  }, {});
};

const sortObj = (obj) => Object.keys(obj).sort().reduce((sorted, prop) => { sorted[prop] = obj[prop]; return sorted; }, {});

async function scaffold() {
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
      message: 'Standards',
      type: 'checkbox',
      name: 'standards',
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
      choices: [
        { name: 'None', value: 'none' },
        { name: 'Webpack', value: 'webpack' },
        // { name: 'Rollup', value: 'rollup' },
      ],
    },
    {
      message: 'Dev Options',
      type: 'checkbox',
      name: 'devOptions',
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
      when: ({ devOptions }) => !!devOptions.logger,
    },
  ]);
  
  const {
    addClient,
    addServer,
    appTitle,
    bundler,
    clientFramework,
    devOptions: {
      hasWatcher,
      logger,
    } = {},
    loggerNamespace,
    serverOptions: {
      externalRequests,
      framework: serverFramework,
      middleware: {
        compression,
        cookies,
        staticFiles,
      } = {},
      webSocket,
    } = {},
    standards,
  } = scaffoldOpts;
  
  if (projectType === 'node') {
    const packageJSON = {
      scripts: {
        build: './bin/prep-dist.sh && NODE_ENV=production webpack',
        start: 'node ./dist/server',
        'start:dev': './bin/prep-dist.sh && webpack & ./watcher.js "./bin/prep-dist.sh" "./dist/public/manifest.json"'
      },
      dependencies: {},
      devDependencies: {},
    };
    
    if (standards.includes('eslint')) {
      packageJSON.devDependencies['eslint'] = '7.5.0';
    }
    
    if (addServer) {
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
    }
    
    if (addClient) {
      switch(clientFramework) {
        case 'svelte': {
          packageJSON.devDependencies['svelte'] = '3.29.0';
          
          if (standards.includes('eslint')) {
            packageJSON.devDependencies['eslint-plugin-svelte3'] = '3.0.0';
          }
        }
      }
      
      switch(bundler) {
        case 'webpack': {
          const usingSvelte = clientFramework === 'svelte';
          
          packageJSON.devDependencies['clean-webpack-plugin'] = '3.0.0';
          packageJSON.devDependencies['css-loader'] = '4.3.0';
          packageJSON.devDependencies['ignore-emit-webpack-plugin'] = '2.0.3';
          packageJSON.devDependencies['mini-css-extract-plugin'] = '0.12.0';
          packageJSON.devDependencies['optimize-css-assets-webpack-plugin'] = '5.0.4';
          packageJSON.devDependencies['terser-webpack-plugin'] = '4.2.3';
          packageJSON.devDependencies['webpack'] = '4.44.2';
          packageJSON.devDependencies['webpack-cli'] = '3.3.12';
          packageJSON.devDependencies['webpack-manifest-plugin'] = '2.2.0';
          
          if (usingSvelte) packageJSON.devDependencies['svelte-loader'] = '2.13.6';
          
          await addParsedFile(
            'webpack.config.js',
            'static/node',
            '',
            [
              { token: 'WP__SVELTE_ALIAS', remove: !usingSvelte },
              { token: 'WP__SVELTE_EXT', remove: !usingSvelte },
              { token: 'WP__SVELTE_LOADERS', remove: !usingSvelte },
              { token: 'WP__SVELTE_MAIN', remove: !usingSvelte },
              { token: 'WP__SVELTE_MODULES', remove: !usingSvelte },
              { token: 'WP__SVELTE_PLUGINS', remove: !usingSvelte },
            ]
          );
        }
      }
    }
    
    if (hasWatcher) {
      if (addServer) {
        packageJSON.devDependencies['chokidar'] = '3.5.1';
        packageJSON.devDependencies['nodemon'] = '2.0.4';
      }
      
      if (addClient) packageJSON.devDependencies['browser-sync'] = '2.26.12';
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
    }
    
    packageJSON.dependencies = sortObj(packageJSON.dependencies);
    packageJSON.devDependencies = sortObj(packageJSON.devDependencies);
    packageJSON.scripts = sortObj(packageJSON.scripts);
    writeFileSync(`${PATH__PROJECT_ROOT}/package.json`, JSON.stringify(packageJSON, null, 2), 'utf8');
    
    mkdirp.sync(`${PATH__PROJECT_ROOT}/src/client`);
    mkdirp.sync(`${PATH__PROJECT_ROOT}/src/server`);
    
    await addParsedFile(
      'constants.js',
      'static/node',
      'src',
      [
        { token: 'CONST__APP_TITLE', replacement: appTitle },
        { token: 'CONST__SVELTE_MNT', remove: clientFramework !== 'svelte' },
        { token: 'CONST__LOGGER_NAMESPACE', remove: !logger },
        { token: 'CONST__LOGGER_NAMESPACE', replacement: loggerNamespace || '--' },
        { token: 'CONST__WS_MESSAGES', remove: !webSocket },
      ]
    );
    
    // TODO
    // - watcher needs tokens for client and server
    // - copy over Svelte app
    // - create/copy over server code
  }

  const containerPlatform = 'docker';
  if (containerPlatform === 'docker') {
    // copy over docker stuff
  }
  
  await Promise.all([
    copyFile(`${PATH__SOURCE_ROOT}/static/.gitignore`, `${PATH__PROJECT_ROOT}/.gitignore`),
  ]);
}

scaffold();

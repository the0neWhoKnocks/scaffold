const { existsSync, readFileSync, writeFileSync } = require('fs');
const { dirname, resolve } = require('path');
const mkdirp = require('mkdirp');
const { prompt } = require('enquirer');

const [
  nodeBinary,
  PATH__SOURCE_SCRIPT,
  PATH__PROJECT_ROOT,
] = process.argv;

// Prevent running the script in it's repo
if (PATH__PROJECT_ROOT.startsWith(dirname(PATH__SOURCE_SCRIPT))) {
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

const replaceTokens = (src, tokens = [], remove = false) => {
  let _src = src;
  
  tokens.forEach(token => {
    const regToken = `(?:\\s+)?\/\/\{TOKEN:(?:\\^|\\$)${token}\}`;
    const reg = new RegExp(`${regToken}\\n(?<inner>[\\s\\S]+)(?=${regToken})${regToken}`, 'm');
    const [wrapped, inner] = _src.match(reg);
    _src = _src.replace(wrapped, remove ? '' : inner);
  });
  
  return _src;
};

async function scaffold() {
  const { projectType } = await prompt({
    type: 'select',
    name: 'projectType',
    message: 'Project Type',
    choices: ['Node.js'],
  });
  console.log(projectType);

  if (projectType === 'Node.js') {
    const packageJSON = {
      scripts: {
        build: './bin/prep-dist.sh && NODE_ENV=production webpack',
        start: 'node ./dist/server',
        'start:dev': './bin/prep-dist.sh && webpack & ./watcher.js "./bin/prep-dist.sh" "./dist/public/manifest.json"'
      },
      dependencies: {},
      devDependencies: {},
    };
    
    // - standards
    const standards = ['eslint'];
    if (standards.includes('eslint')) {
      packageJSON.devDependencies['eslint'] = '7.5.0';
    }
    
    // - server
    const { serverFramework } = await prompt({
      type: 'select',
      message: 'Server Framework',
      name: 'serverFramework',
      choices: ['vanilla Node', 'Express', 'Polka'],
    });
    const middlewareDisabled = serverFramework === 'vanilla Node';
    const { serverOpts } = await prompt({
      type: 'multiselect',
      message: 'Server Options',
      name: 'serverOpts',
      choices: [
        { message: 'Will make external requests', name: 'externalRequests' },
        { message: 'Should support Web Sockets', name: 'websocket' },
        { 
          message: 'Middleware', 
          name: 'middleware',
          choices: [
            { message: 'Should gzip responses', name: 'compression', disabled: middlewareDisabled },
            { message: 'Should be able to read/write cookies', name: 'cookies', disabled: middlewareDisabled },
            { message: 'Will serve static assets', name: 'staticFiles', disabled: middlewareDisabled },
          ],
          disabled: middlewareDisabled,
        },
      ],
    });
    console.log(serverFramework, serverOpts);
    process.exit(0);
    switch(serverOpts.framework) {
      case 'polka': {
        packageJSON.devDependencies['polka'] = '1.0.0-next.11';
        break;
      }
    }
    if (serverOpts.externalRequests) {
      packageJSON.dependencies['teeny-request'] = '7.0.1';
    }
    if (serverOpts.middleware) {
      const {
        compression,
        cookies,
        staticFiles,
      } = serverOpts.middleware;
      
      if (compression) packageJSON.dependencies['compression'] = '1.7.1';
      if (cookies) packageJSON.dependencies['cookie-parser'] = '1.4.5';
      if (staticFiles) packageJSON.dependencies['sirv'] = '0.4.0';
    }
    if (serverOpts.websocket) {
      packageJSON.dependencies['bufferutil'] = '4.0.1';
      packageJSON.dependencies['supports-color'] = '7.2.0';
      packageJSON.dependencies['ws'] = '7.3.1';
    }
    
    // - frameworks
    const framework = 'svelte';
    if (framework === 'svelte') {
      packageJSON.devDependencies['svelte'] = '3.29.0';
      
      if (standards.includes('eslint')) {
        packageJSON.devDependencies['eslint-plugin-svelte3'] = '3.0.0';
      }
    }
    
    // - bundler
    const bundler = 'webpack';
    if (bundler === 'webpack') {
      const PATH__SRC__WP_CONF = resolve(__dirname, './static/node/webpack.config.js');
      const PATH__OUTPUT__WP_CONF = resolve(PATH__PROJECT_ROOT, './webpack.config.js');
      let wpConf = readFileSync(PATH__SRC__WP_CONF, 'utf8');
      
      packageJSON.devDependencies['clean-webpack-plugin'] = '3.0.0';
      packageJSON.devDependencies['css-loader'] = '4.3.0';
      packageJSON.devDependencies['ignore-emit-webpack-plugin'] = '2.0.3';
      packageJSON.devDependencies['mini-css-extract-plugin'] = '0.12.0';
      packageJSON.devDependencies['optimize-css-assets-webpack-plugin'] = '5.0.4';
      packageJSON.devDependencies['terser-webpack-plugin'] = '4.2.3';
      packageJSON.devDependencies['webpack'] = '4.44.2';
      packageJSON.devDependencies['webpack-cli'] = '3.3.12';
      packageJSON.devDependencies['webpack-manifest-plugin'] = '2.2.0';
      
      if (framework === 'svelte') {
        packageJSON.devDependencies['svelte-loader'] = '2.13.6';
      }
      wpConf = replaceTokens(wpConf, [
        '__WP__SVELTE_ALIAS',
        '__WP__SVELTE_EXT',
        '__WP__SVELTE_LOADERS',
        '__WP__SVELTE_MAIN',
        '__WP__SVELTE_MODULES',
        '__WP__SVELTE_PLUGINS',
      ], framework !== 'svelte');
      
      writeFileSync(PATH__OUTPUT__WP_CONF, wpConf, 'utf8');
    }
    
    // - dev
    const devOpts = {
      hasWatcher: true,
      logger: 'ulog',
    };
    if (devOpts.hasWatcher) {
      packageJSON.devDependencies['browser-sync'] = '2.26.12';
      packageJSON.devDependencies['chokidar'] = '3.5.1';
      packageJSON.devDependencies['nodemon'] = '2.0.4';
    }
    if (devOpts.logger) {
      let moduleVersion;

      switch(serverOpts.logger) {
        case 'ulog': {
          moduleVersion = '2.0.0-beta.18';
          break;
        }
      }
      
      packageJSON.dependencies['anylogger'] = '1.0.10';
      packageJSON.dependencies[serverOpts.logger] = moduleVersion;
    }
  }

  const containerPlatform = 'docker';
  if (containerPlatform === 'docker') {
    // copy over docker stuff
  }
}

scaffold();

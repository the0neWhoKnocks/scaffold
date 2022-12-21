#!/usr/bin/env node

//TOKEN:^WATCHER__CLIENT
const { create } = require('browser-sync');
//TOKEN:$WATCHER__CLIENT
//TOKEN:^WATCHER__SERVER
const nodemon = require('nodemon');
const chokidar = require('chokidar');
//TOKEN:$WATCHER__SERVER
//TOKEN:^WATCHER__LOGGER
const logger = require('./src/utils/logger')('watcher');
//TOKEN:$WATCHER__LOGGER
const { SERVER__PORT } = require('./src/constants');

//TOKEN:^WATCHER__SERVER
let httpModule;
let protocol = 'http';
//TOKEN:$WATCHER__SERVER
//TOKEN:^WATCHER__CLIENT
const browserSync = create();
let bSyncHTTPS;
//TOKEN:$WATCHER__CLIENT

if (process.env.NODE_EXTRA_CA_CERTS) {
  //TOKEN:^WATCHER__SERVER
  httpModule = require('https');
  protocol = 'https';
  //TOKEN:$WATCHER__SERVER
  //TOKEN:^WATCHER__CLIENT
  bSyncHTTPS = {
    cert: process.env.NODE_EXTRA_CA_CERTS,
    key: process.env.NODE_EXTRA_CA_CERTS.replace('.crt', '.key'),
  }
  //TOKEN:$WATCHER__CLIENT
}
//TOKEN:^WATCHER__SERVER
else {
  httpModule = require('http');
}
//TOKEN:$WATCHER__SERVER

//TOKEN:^WATCHER__SERVER
const checkServer = () => new Promise((rootResolve, rootReject) => {
  let count = 0;
  const check = () => new Promise((resolve, reject) => {
    setTimeout(() => {
      const serverAddress = `${protocol}://localhost:${SERVER__PORT}`;
      const opts = {};

      if (protocol === 'https') {
        // NOTE - Depending on your Dev env, your self-signed certs may
        // throw this error `UNABLE_TO_VERIFY_LEAF_SIGNATURE` during Server
        // restart. Not sure why it doesn't happen on start of the Server, but
        // this will get around that issue (which is fine in development, not Prod).
        opts.rejectUnauthorized = false;
      }
      
      //TOKEN:^WATCHER__LOGGER
      logger.info(`Pinging ${serverAddress}`);
      //TOKEN:$WATCHER__LOGGER
      httpModule
        .get(serverAddress, opts, (res) => resolve(res))
        .on('error', (err) => reject(err));
    }, 1000);
  });
  const handleError = (err) => {
    if (count < 3) {
      ping();
      count++;
    }
    else {
      //TOKEN:^WATCHER__LOGGER
      logger.error(err);
      //TOKEN:$WATCHER__LOGGER
      rootReject();
    }
  };
  const handleSuccess = () => { rootResolve(); };
  const ping = () => {
    check()
      .then(handleSuccess)
      .catch(handleError);
  };

  ping();
});
//TOKEN:$WATCHER__SERVER

const fileCheck = (file, timeout = 30) => new Promise((resolveCheck, rejectCheck) => {
  const { existsSync } = require('fs');
  const { resolve } = require('path');
  const filePath = resolve(__dirname, file);
  const exists = () => existsSync(filePath);
  let elapsedTime = 0;

  if (exists()) resolveCheck();
  else {
    //TOKEN:^WATCHER__LOGGER
    logger.info(`Waiting for "${filePath}"\n to exist before starting.\n`);
    //TOKEN:$WATCHER__LOGGER
    const int = setInterval(() => {
      elapsedTime++;
      
      //TOKEN:^WATCHER__LOGGER
      logger.info('Looking for file');
      //TOKEN:$WATCHER__LOGGER
      
      if (exists()) {
        //TOKEN:^WATCHER__LOGGER
        logger.info('File found, starting...\n');
        //TOKEN:$WATCHER__LOGGER
        clearInterval(int);
        resolveCheck();
      }
      else if (elapsedTime === timeout) {
        clearInterval(int);
        rejectCheck(`\nWaited for ${timeout} seconds for "${filePath}"\n to exist, but it was not found.\n`);
      }
    }, 1000);
  }
});

const args = process.argv.splice(2);
const serverSyncCmd = args[0];
const waitForFileBeforeStart = args[1];
const fileGate = (waitForFileBeforeStart)
  ? fileCheck(waitForFileBeforeStart)
  : Promise.resolve();
//TOKEN:^WATCHER__SERVER
const watchedServerFiles = [
  './src/server/**/*.js',
  './src/utils/**/*.js',
  './src/constants.js',
];
//TOKEN:$WATCHER__SERVER

const chokidarOpts = { ignoreInitial: true };

fileGate
  .then(() => {
    //TOKEN:^WATCHER__SERVER
    const serverFilesWatcher = chokidar.watch(watchedServerFiles, chokidarOpts);
    serverFilesWatcher
      .on('ready', () => {
        //TOKEN:^WATCHER__LOGGER
        logger.info('Watching for Server changes');
        //TOKEN:$WATCHER__LOGGER
      })
      .on('all', (ev, p) => { // events are: add addDir change unlink unlinkDir
        if (!serverFilesWatcher.events) serverFilesWatcher.events = [];
        serverFilesWatcher.events.push([ev, p]);

        if (!serverFilesWatcher.debounce) {
          serverFilesWatcher.debounce = setTimeout(() => {
            //TOKEN:^WATCHER__LOGGER
            logger.info(`Server updates:\n  - ${serverFilesWatcher.events.map(([_ev, _p]) => `${_ev}: ${_p}`).join('\n  - ')}`);
            //TOKEN:$WATCHER__LOGGER
            delete serverFilesWatcher.debounce;
            delete serverFilesWatcher.events;
            
            if (serverSyncCmd) {
              const { execSync } = require('child_process');
              execSync(serverSyncCmd);
            }
          }, 300);
        }
      });

    nodemon({
      delay: 500,
      exec: 'node --inspect=0.0.0.0',
      ext: 'js json',
      script: './dist/server',
      // verbose: true,
      watch: watchedServerFiles,
    })
      .on('restart', () => {
        //TOKEN:^WATCHER__LOGGER
        logger.info('Server restarting because file(s) changed');
        //TOKEN:$WATCHER__LOGGER
    
        checkServer()
          .then(() => {
            //TOKEN:^WATCHER__LOGGER
            logger.info('Server has fully started');
            //TOKEN:$WATCHER__LOGGER
            //TOKEN:^WATCHER__CLIENT
            browserSync.reload();
            //TOKEN:$WATCHER__CLIENT
          })
          .catch(() => {
            //TOKEN:^WATCHER__LOGGER
            logger.info("Couldn't detect the Server, a manual reload may be required");
            //TOKEN:$WATCHER__LOGGER
          });
      });
    //TOKEN:$WATCHER__SERVER
    
    //TOKEN:^WATCHER__CLIENT
    // https://www.browsersync.io/docs/options
    browserSync.init({
      files: [
        'dist/public/manifest.json',
      ],
      ghostMode: false, // don't mirror interactions in other browsers
      https: bSyncHTTPS,
      // logLevel: 'debug',
      notify: false, // Don't show any notifications in the browser.
      open: false,
      port: SERVER__PORT + 1,
      proxy: {
        target: `${protocol}://localhost:${SERVER__PORT}`,
        ws: true,
      },
      reloadDebounce: 300, // Wait for a specified window of event-silence before sending any reload events.
      snippetOptions: {
        rule: {
          match: /<\/body>/i,
          fn: (snippet) => snippet,
        },
      },
      ui: {
        port: SERVER__PORT + 2,
      },
      watchOptions: chokidarOpts,
    });
    //TOKEN:$WATCHER__CLIENT
    
    function killWatcher(evType) {
      //TOKEN:^WATCHER__LOGGER
      logger.info(`Killing watcher (${evType})`);
      //TOKEN:$WATCHER__LOGGER
      //TOKEN:^WATCHER__CLIENT
      browserSync.exit();
      //TOKEN:$WATCHER__CLIENT
      //TOKEN:^WATCHER__SERVER
      serverFilesWatcher.close();
      nodemon.emit('quit');
      //TOKEN:$WATCHER__SERVER
      process.exit(0);
    }
    
    process.on('SIGINT', killWatcher.bind(null, 'SIGINT'));
    process.on('SIGTERM', killWatcher.bind(null, 'SIGTERM'));
    process.on('SIGUSR2', killWatcher.bind(null, 'SIGUSR2'));
  })
  .catch(err => {
    //TOKEN:^WATCHER__LOGGER
    logger.error(err);
    //TOKEN:$WATCHER__LOGGER
    process.exit(1);
  });
  
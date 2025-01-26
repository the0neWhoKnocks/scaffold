const webpackPreprocessor = require('@cypress/webpack-preprocessor');
const { defineConfig } = require('cypress');
const webpack = require('webpack');

module.exports = defineConfig({
  chromeWebSecurity: false,
  e2e: {
    setupNodeEvents(on) { // `setupNodeEvents` is here to account for Server section in `constants`
      const options = webpackPreprocessor.defaultOptions;
      options.webpackOptions.plugins = options.webpackOptions.plugins ?? [];
      options.webpackOptions.plugins.push(
        new webpack.DefinePlugin({
          'process.env.FOR_CLIENT_BUNDLE': JSON.stringify(true),
        })
      );

      on('file:preprocessor', webpackPreprocessor(options));
    },
    specPattern: 'tests/**/*.test.{js,jsx,ts,tsx}',
    testIsolation: false, // when `true` things get reset for every `it` call
  },
  modifyObstructiveCode: false,
  numTestsKeptInMemory: 0,
  reporter: "spec",
  retries: {
    openMode: 0,
    runMode: 4,
  },
  scrollBehavior: 'center',
  video: false,
});

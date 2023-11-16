const { resolve } = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const TerserJSPlugin = require('terser-webpack-plugin');
const IgnoreEmitPlugin = require('ignore-emit-webpack-plugin');
//TOKEN:^WP__SVELTE
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
//TOKEN:$WP__SVELTE

const HASH_LENGTH = 5;
const alias = {
  //TOKEN:^WP__SVELTE
  svelte: resolve('node_modules', 'svelte/src/runtime'),
  //TOKEN:$WP__SVELTE
};
const conditionNames = [
  'require',
  'node',
  'svelte',
];
const extensions = [
  //TOKEN:^WP__SVELTE
  '.svelte',
  //TOKEN:$WP__SVELTE
  '.mjs',
  '.js',
  '.json',
  '.html',
];
const mainFields = [
  //TOKEN:^WP__SVELTE
  'svelte',
  //TOKEN:$WP__SVELTE
  'module',
  'browser',
  'main',
];
const mode = process.env.NODE_ENV || 'development';
const dev = mode === 'development';

const outputFilename = ({ chunk: { name }, contentHashType }) => {
  let _name;
  
  switch (contentHashType) {
    //TOKEN:^WP__SVELTE
    case 'css/mini-extract': {
      // dump CSS files in a 'css' folder
      const newName = name.replace(/^js\//, 'css/');
      _name = `${newName}_[chunkhash:${HASH_LENGTH}].css`;
      break;
    }
    //TOKEN:$WP__SVELTE
    case 'javascript': {
      _name = `[name]_[chunkhash:${HASH_LENGTH}].js`;
      break;
    }
  }
  
  return _name;
};

const conf = {
  devtool: dev && 'inline-cheap-source-map',
  entry: {
    'js/app': resolve(__dirname, './src/client/index.js'),
  },
  mode,
  module: {
    rules: [
      //TOKEN:^WP__SVELTE
      {
        test: /\.(svelte|html)$/,
        use: {
          loader: 'svelte-loader',
          // Svelte compiler options: https://svelte.dev/docs#compile-time-svelte-compile
          options: {
            compilerOptions: { dev },
            emitCss: true,
            hotReload: false,
          },
        },
      },
      {
        test: /\.css$/, // For any CSS files that are extracted and inlined by Svelte
        use: [
          MiniCssExtractPlugin.loader,
          // translates CSS into CommonJS
          {
            loader: 'css-loader',
            options: { sourceMap: dev },
          },
          // remove duplicate svelte classes
          { loader: resolve('./.webpack/loader.remove-duplicate-svelte-classes') },
        ],
      },
      //TOKEN:$WP__SVELTE
    ],
  },
  optimization: {
    minimizer: [
      new TerserJSPlugin({}),
      //TOKEN:^WP__SVELTE
      new CssMinimizerPlugin(),
      //TOKEN:$WP__SVELTE
    ],
    splitChunks: {
      cacheGroups: {
        vendor: {
          chunks: 'initial',
          enforce: true,
          name: 'js/vendor',
          test: /[\\/]node_modules[\\/]/,
        },
      },
    },
  },
  output: {
    // Point sourcemap entries to original disk location (format as URL on Windows)
    devtoolModuleFilenameTemplate: info => resolve(info.absoluteResourcePath).replace(/\\/g, '/'),
    // assigns the hashed name to the file
    chunkFilename: outputFilename,
    filename: outputFilename,
    path: resolve(__dirname, './dist/public'),
    publicPath: '/',
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanOnceBeforeBuildPatterns: [
        '**/*',
        '!manifest.json', // the watcher won't pick up on changes if this is deleted
        // NOTE - Uncomment/update the below if you have extra assets that should
        // not be deleted. Examples of such files/folders are anything generated
        // at startup before the bundling has started. Note that you have to
        // exclude the folder and it's contents separately.
        // '!imgs',
        // '!imgs/**/*',
      ],
      //TOKEN:^WP__SVELTE
      cleanStaleWebpackAssets: false, // Cleaning after rebuilds doesn't play nice with `mini-css-extract-plugin`
      //TOKEN:$WP__SVELTE
    }),
    new webpack.DefinePlugin({
      'process.env.FOR_CLIENT_BUNDLE': JSON.stringify(true),
    }),
    //TOKEN:^WP__SVELTE
    new MiniCssExtractPlugin({
      chunkFilename: outputFilename,
      filename: outputFilename,
    }),
    //TOKEN:$WP__SVELTE
    /**
     * WP tries to emit the JS files for extracted CSS files, this prevents that
     */
    new IgnoreEmitPlugin(/global.+\.js(\.map)?$/),
    /**
     * Generate a manifest file which contains a mapping of all asset filenames
     * to their corresponding output file so that tools can load them without
     * having to know the hashed name.
     */
    new WebpackManifestPlugin({
      filter: ({ isChunk, isInitial, path }) => {
        return (
          (isChunk && isInitial)
          // ignore Stylus (`global` JS files) & source-map files
          && !/(global.+\.js|\.map)$/.test(path)
        );
      },
      map: (fd) => {
        // strip off preceding directory info, the name is enough
        fd.name = fd.name.split('/').pop();
        return fd;
      },
      writeToFileEmit: true,
    }),
  ],
  resolve: { alias, conditionNames, extensions, mainFields },
  stats: {
    children: false,
    entrypoints: false,
  },
  //TOKEN:^WP__WATCH
  watch: dev,
  //TOKEN:$WP__WATCH
};
//TOKEN:^WP__WATCH

// related to WSL2: https://github.com/microsoft/WSL/issues/4739
if (dev && !!process.env.WSL_INTEROP) {
  conf.watchOptions = {
    aggregateTimeout: 200,
    poll: 1000,
  };
}
//TOKEN:$WP__WATCH

module.exports = conf;

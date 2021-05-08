const {
  APP__TITLE,
  //TOKEN:^SHELL__SVELTE
  DOM__SVELTE_MOUNT_POINT,
  //TOKEN:$SHELL__SVELTE
} = require('../constants');

const shell = ({ params, view } = {}) => {
  //TOKEN:^SHELL__BUNDLER__WEBPACK
  const MANIFEST_PATH = '../public/manifest.json';
  if (process.env.NODE_ENV !== 'production') delete require.cache[require.resolve(MANIFEST_PATH)];
  const manifest = require(MANIFEST_PATH);
  const viewCSS = (manifest[`${view}.css`])
    ? `<link rel="stylesheet" href="${manifest[`${view}.css`]}">`
    : '';
  //TOKEN:$SHELL__BUNDLER__WEBPACK
  //TOKEN:^SHELL__HEROKU
  const buildNumber = process.env.SOURCE_VERSION; // exposed by Heroku during build
  //TOKEN:$SHELL__HEROKU

  return `
    <!doctype html>
    <html lang="en">
    <head>
      <title>${APP__TITLE}</title>

      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width,initial-scale=1.0">
      
      <style>
        *, *::after, *::before {
          box-sizing: border-box;
        }

        html, body {
          width: 100%;
          height: 100%;
          padding: 0;
          margin: 0;
        }

        body {
          color: #333;
          font-family: Roboto, -apple-system, BlinkMacSystemFont, Segoe UI, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
          font-size: 16px;
          line-height: 1.5;
          margin: 0;
        }

        h1, h2, h3, h4, h5, h6 {
          margin: 0 0 0.5em 0;
          font-weight: 400;
          line-height: 1.2;
        }

        h1 {
          font-size: 2em;
        }

        a {
          color: inherit;
        }

        code {
          font-family: menlo, inconsolata, monospace;
          font-size: calc(1em - 2px);
          color: #555;
          background-color: #f0f0f0;
          padding: 0.2em 0.4em;
          border-radius: 2px;
        }

        button {
          font-size: 1em;
          padding: 0.5em;
          display: block;
        }
        button:not(:disabled) {
          cursor: pointer;
        }

        input {
          font-size: 1em;
        }
        input[type="text"] {
          padding: 0.25em;
        }

        p {
          margin: 0;
        }
        p:not(:last-child) {
          margin-bottom: 1em;
        }

        q {
          color: #501600;
          font-style: italic;
          font-family: serif;
          font-weight: bold;
          padding: 0 0.5em;
          border-radius: 0.25em;
          background: #ffeb00;
          display: inline-block;
        }

        .loading-msg {
          width: 100%;
          height: 100%;
          padding: 2em;
          display: flex;
          justify-content: center;
          align-items: center;
          animation-name: showMsg;
          animation-duration: 300ms;
          animation-delay: 300ms;
          animation-fill-mode: both;
        }
        body.no-js .loading-msg .msg,
        body.view-loaded .loading-msg,
        body:not(.view-loaded) #${DOM__SVELTE_MOUNT_POINT} {
          display: none;
        }

        .root,
        #${DOM__SVELTE_MOUNT_POINT} {
          width: 100%;
          height: 100%;
        }
      </style>
      
      //TOKEN:^SHELL__BUNDLER__WEBPACK
      ${viewCSS}
      //TOKEN:$SHELL__BUNDLER__WEBPACK

      <script>
        window.app = {
          //TOKEN:^SHELL__HEROKU
          buildNumber: ${buildNumber},
          //TOKEN:$SHELL__HEROKU
          params: ${JSON.stringify(params || {})},
        };
      </script>
    </head>
    <body class="no-js">
      <script>
        document.body.classList.remove('no-js');
      </script>
      
      <div class="root">
        <div class="loading-msg">
          <span class="msg">Loading...</span>
          <noscript>
            This App requires Javascript. You'll have to enable it in order to proceed.
          </noscript>
        </div>
        //TOKEN:^SHELL__SVELTE
        <div id="${DOM__SVELTE_MOUNT_POINT}"></div>
        //TOKEN:$SHELL__SVELTE
      </div>
      
      //TOKEN:^SHELL__BUNDLER__WEBPACK
      <script src="${manifest['vendor.js']}"></script>
      <script src="${manifest[`${view}.js`]}"></script>
      //TOKEN:$SHELL__BUNDLER__WEBPACK
    </body>
    </html>
  `;
};

module.exports = shell;

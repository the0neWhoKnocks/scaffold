const {
  APP__TITLE,
  //TOKEN:^SHELL__SVELTE
  DOM__SVELTE_MOUNT_POINT,
  //TOKEN:$SHELL__SVELTE
} = require('../constants');

const shell = ({ props, view } = {}) => {
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
        
        form > *:not(:last-child) {
          margin-bottom: 1em;
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
          props: ${JSON.stringify(props || {})},
        };
      </script>
    </head>
    <body class="no-js">
      //TOKEN:^SHELL__MULTI_USER
      <svg style="display:none; position:absolute" width="0" height="0">
        <symbol id="asterisk" viewBox="0 0 32.275391 30.46875" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 14.355469l2.2460938-6.933594c5.1757707 1.8229802 8.9355322 3.401755 11.2792972 4.736328C12.906885 6.2663426 12.581365 2.2136123 12.548828 0h7.080078c-.09768 3.2227258-.472027 7.2591801-1.123047 12.109375 3.35284-1.692646 7.193982-3.2551444 11.523438-4.6875l2.246094 6.933594c-4.134146 1.367244-8.186877 2.278702-12.158204 2.734375 1.985652 1.725314 4.785129 4.801483 8.398438 9.228515L22.65625 30.46875c-1.888045-2.57157-4.11786-6.070915-6.689453-10.498047-2.408871 4.589892-4.524754 8.089238-6.3476564 10.498047l-5.7617187-4.150391c3.7760309-4.654896 6.4778511-7.731065 8.1054691-9.228515C7.763661 16.276098 3.7760348 15.364641 0 14.355469" font-family="arial" font-size="100"/>
        </symbol>
        <symbol id="user" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">
          <circle cx="300" cy="300" r="265" fill="none" stroke="currentColor" stroke-width="30" />
          <circle cx="300" cy="230" r="115" />
          <path d="M106.819 481.4c37.887-106.691 155.09-162.469 261.781-124.582 58.165 20.654 103.927 66.417 124.582 124.582 0 0-61.682 83.6-193.182 83.6s-193.181-83.6-193.181-83.6z" />
        </symbol>
        <symbol id="angle-up" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
          <path d="M1395 1184q0 13-10 23l-50 50q-10 10-23 10t-23-10l-393-393-393 393q-10 10-23 10t-23-10l-50-50q-10-10-10-23t10-23l466-466q10-10 23-10t23 10l466 466q10 10 10 23z"/>
        </symbol>
        <symbol id="angle-down" viewBox="0 0 1792 1792" xmlns="http://www.w3.org/2000/svg">
          <path d="M1395 736q0 13-10 23l-466 466q-10 10-23 10t-23-10l-466-466q-10-10-10-23t10-23l50-50q10-10 23-10t23 10l393 393 393-393q10-10 23-10t23 10l50 50q10 10 10 23z"/>
        </symbol>
      </svg>
      //TOKEN:$SHELL__MULTI_USER
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

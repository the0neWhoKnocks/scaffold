FROM mcr.microsoft.com/playwright:v1.48.0-noble AS playwright_v1

# RUN npm i -g -E @playwright/test@1.48.0

# RUN \
#   npm i -g \
#   # manage browser launch permissions for various APIs such as Notifications, Geolocation, Cookies, Images, and more
#   cypress-browser-permissions@1.1.0 \
#   # to allow for the mention of `process` in imported commonJS files
#   process@0.11.10 \
#   # to allow for editing Cypress' WP config
#   @babel/core@7.23.2 @babel/preset-env@7.23.2 @cypress/webpack-preprocessor@6.0.0 babel-loader@9.1.3 webpack@5.89.0 \
#   # create symlink so global modules can be found
#   && ln -s /usr/local/lib/node_modules /node_modules
# ENV NODE_PATH /usr/local/lib/node_modules

RUN npm i -g -E @playwright/test@1.48.0 \
  # create symlink so global modules can be found
  && ln -s /usr/lib/node_modules /node_modules

ENV NODE_PATH /node_modules
  
RUN mkdir /e2e && chown pwuser:pwuser /e2e

WORKDIR /e2e

USER pwuser

RUN mkdir ./results

# RUN npm i -g -E @playwright/test@1.48.0

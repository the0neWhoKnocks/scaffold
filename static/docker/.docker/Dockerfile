## Base Node image
FROM node:20.6.0-alpine3.18 AS node20-dev-base
# Add any extra base packages below. Comment why they're added for your own 
# sanity later. Add any App specific packages further down (there's a comment).
# - `rsync` for the `dist` setup
# - `tzdata` so the `TZ` env var works for timezones
# - `vim zsh` for development env
RUN apk add --no-cache --update rsync tzdata vim zsh

# Set up a usable terminal experience for development
RUN echo "update-notifier=false" >> /home/node/.npmrc
COPY ./.docker/.vimrc /home/node/.vimrc
COPY ./.docker/.zshrc /home/node/.zshrc
COPY ./.docker/zsh-autosuggestions.zsh /home/node/zsh-autosuggestions.zsh

## Create intermediary Container specifically for package.json 
FROM node20-dev-base AS #TOKEN:#DOCKER__APP_NAME--packagejson
# Create a temporary package.json where things like `version` and `scripts`
# are omitted so the cache of the build step won't be invalidated.
COPY --chown=node:node ./package*.json ./
RUN ["node", "-e", " \
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8')); \
  const lock = (fs.existsSync('package-lock.json')) \
    ? JSON.parse(fs.readFileSync('package-lock.json', 'utf-8')) \
    : false; \
  \
  let preInstallScript; \
  if (pkg.scripts && pkg.scripts.preinstall) preInstallScript = pkg.scripts.preinstall; \
  \
  delete pkg.devDependencies; \
  delete pkg.scripts; \
  delete pkg.version; \
  if (lock) delete lock.version; \
  \
  if (preInstallScript) pkg.scripts = { preinstall: preInstallScript }; \
  \
  fs.writeFileSync('package.json', JSON.stringify(pkg)); \
  if (lock) fs.writeFileSync('package-lock.json', JSON.stringify(lock)); \
"]

# Set up the environment
FROM node20-dev-base AS #TOKEN:#DOCKER__APP_NAME
ENV APP=/home/node/app
ENV IN_CONTAINER=true
ENV NODE_ENV=production
RUN mkdir -p $APP/node_modules && chown -R node:node /home/node/*

######
## Add App specific packages below
######
#RUN apk add --no-cache --update __PKG__

WORKDIR $APP

# Copy over package related files from the preperation step to install
# production modules
COPY --chown=node:node --from=#TOKEN:#DOCKER__APP_NAME--packagejson ./package*.json ./

# Install production dependencies and compile assets
RUN npm i --only=production --quiet --unsafe-perm \
  && rm ./package*.json

# Copy locally compiled code to the image
#TOKEN:^DOCKER__CLIENT_OR_SERVER
COPY --chown=node:node ./dist/constants.js ./constants.js
COPY --chown=node:node ./dist/utils ./utils
#TOKEN:$DOCKER__CLIENT_OR_SERVER
#TOKEN:^DOCKER__SERVER
COPY --chown=node:node ./dist/server ./server
#TOKEN:$DOCKER__SERVER
#TOKEN:^DOCKER__CLIENT
COPY --chown=node:node ./dist/public ./public
#TOKEN:$DOCKER__CLIENT

# Expose the default port from the Server, on the container
EXPOSE 3000

# Start the app
CMD ["node", "server"]

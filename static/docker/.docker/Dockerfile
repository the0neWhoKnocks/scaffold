## Base Node image
FROM node:14-alpine as node-w-tz
# - `tzdata` so the `TZ` env var works for timezones
RUN apk add --no-cache --update tzdata

# start building the base
FROM node-w-tz as #TOKEN:#DOCKER__APP_NAME--packagejson
# Create a temporary package.json where things like `version` and `scripts`
# are omitted so the cache of the build step won't be invalidated.
COPY --chown=node:node ./package*.json ./
RUN ["node", "-e", " \
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8')); \
  const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf-8')); \
  \
  let preInstallScript; \
  if (pkg.scripts && pkg.scripts.preinstall) preInstallScript = pkg.scripts.preinstall; \
  \
  delete pkg.devDependencies; \
  delete pkg.scripts; \
  delete pkg.version; \
  delete lock.version; \
  \
  if (preInstallScript) pkg.scripts = { preinstall: preInstallScript }; \
  \
  fs.writeFileSync('package.json', JSON.stringify(pkg)); \
  fs.writeFileSync('package-lock.json', JSON.stringify(lock)); \
"]

# Set up the environment
FROM node-w-tz AS #TOKEN:#DOCKER__APP_NAME
ENV NODE_ENV=production
ENV APP=/home/node/app
RUN mkdir -p $APP/node_modules && chown -R node:node /home/node/*

# Set up a usable terminal experience for development
COPY ./.docker/.vimrc /home/node/.vimrc
COPY ./.docker/.zshrc /home/node/.zshrc
COPY ./.docker/zsh-autosuggestions.zsh /home/node/zsh-autosuggestions.zsh
RUN apk add --no-cache --update vim zsh \
  && touch /home/node/.zsh_history \
  && chmod +x /home/node/.vimrc /home/node/.zsh_history /home/node/.zshrc /home/node/zsh-autosuggestions.zsh

WORKDIR $APP

# Copy over package related files from the preperation step to install
# production modules
COPY --chown=node:node --from=#TOKEN:#DOCKER__APP_NAME--packagejson ./package*.json ./

# Install production dependencies and compile assets
RUN npm i --only=production --quiet --unsafe-perm \
  && rm ./package*.json

# Copy locally compiled code to the image
COPY --chown=node:node ./dist ./

# Expose the default port from the Server, on the container
EXPOSE 3000

# Start the app
CMD ["node", "server"]

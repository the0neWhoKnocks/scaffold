# source Dockerfile https://github.com/cypress-io/cypress-docker-images/blob/master/included/5.1.0/Dockerfile
FROM cypress/included:13.3.0 AS cypress_v13

# # update lists
# RUN apt-get update
# # add binaries
# RUN apt-get -y install ffmpeg
# # reclaim some space
# RUN apt-get clean

RUN \
  npm i -g \
  # # for ...(explain why modules are needed)
  # mkdirp rimraf \
  # to allow for the mention of `process` in imported commonJS files
  process@0.11.10 \
  # to allow for editing Cypress' WP config
  @babel/core@7.23.2 @babel/preset-env@7.23.2 @cypress/webpack-preprocessor@6.0.0 babel-loader@9.1.3 webpack@5.89.0 \
  # create symlink so global modules can be found
  && ln -s /usr/local/lib/node_modules /node_modules
ENV NODE_PATH /usr/local/lib/node_modules

# don't display "What's New" screen on start
COPY --chown=node:node ./state.json /home/node/.config/Cypress/cy/production/projects/__global__/

WORKDIR /e2e

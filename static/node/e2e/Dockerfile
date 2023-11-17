# source Dockerfile https://github.com/cypress-io/cypress-docker-images/blob/master/included/5.1.0/Dockerfile
FROM cypress/included:13.3.0 AS cypress_v13

# # update lists
# RUN apt-get update
# # add binaries
# RUN apt-get -y install ffmpeg
# # reclaim some space
# RUN apt-get clean

RUN \
  # npm i -g \
  # # for (explain why modules are needed)
  # mkdirp rimraf \
  # # create symlink so global modules can be found
  # && ln -s /usr/local/lib/node_modules /node_modules
  # create symlink so global modules can be found
  ln -s /usr/local/lib/node_modules /node_modules
ENV NODE_PATH /usr/local/lib/node_modules

# don't display "What's New" screen on start
COPY --chown=node:node ./state.json /home/node/.config/Cypress/cy/production/projects/__global__/

WORKDIR /e2e

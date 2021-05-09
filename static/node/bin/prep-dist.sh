#!/bin/bash

# Create required directories
mkdir -p #TOKEN:#PREP__FOLDERS

# Sync Server files, delete anything that doesn't exist anymore
rsync -avh \
  #TOKEN:#PREP__SERVER_FILE_PATHS
  ./dist --delete

#!/bin/sh

# Create required directories
mkdir -p #TOKEN:#PREP__FOLDERS

# Sync Server files, delete anything that doesn't exist anymore
rsync -avh \
  #TOKEN:#PREP__SERVER_FILE_PATHS
  ./dist --delete
#TOKEN:^PREP__STATIC

# Sync Static files
rsync -avh \
  ./src/static \
  ./dist/public/imgs --delete
#TOKEN:$PREP__STATIC

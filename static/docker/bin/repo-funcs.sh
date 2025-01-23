#!/bin/bash

CONTAINER="#TOKEN:#REPOFUNCS__APP_NAME_DEV"
export REPO_FUNCS=()

# Wire up the current User so that any files created in development can easily
# be manipulated by the User or during test runs.
# Export to ensure `docker compose` can use'm
export CURR_UID=$(id -u)
export CURR_GID=$(id -g)

REPO_FUNCS+=("startcont")
function startcont {
  # ensure required directories are set up
  mkdir -p ./{.app_data,.ignore}
  touch ./.ignore/.zsh_history
  chmod 777 ./.ignore/.zsh_history
  #TOKEN:^REPOFUNCS__DOTENV
  
  envPath="./.env"
  if [ ! -f "${envPath}" ]; then
    echo -e "##\n# NOTE: Any new variables should have defaults added in 'repo-funcs.sh'\n##\n" >> "${envPath}"
    echo "EXAMPLE_VAR=<VAL>" >> "${envPath}"
    
    echo -e "\n The '.env' file wasn't set up, so it was populated with temporary values.\n Any variables with '<VAL>' need to be updated."
    return
  elif grep -q "<VAL>" "${envPath}"; then
    echo -e "\n The '.env' file contains variables that need '<VAL>' replaced."
    return
  fi
  #TOKEN:$REPOFUNCS__DOTENV
  #TOKEN:^REPOFUNCS__SECURE
  
  if [ ! -d "./certs" ]; then
    echo -e "\n You need to set up the 'certs' folder.\n If you don't know how, follow the instructions on https://github.com/the0neWhoKnocks/generate-certs."
    return
  fi
  #TOKEN:$REPOFUNCS__SECURE
  
  # ensure base files/folders are available to copy to container during `build`
  ./bin/prep-dist.sh
  
  # boot container and enter it
  docker compose up --remove-orphans -d "${CONTAINER}"
  exitCode=$?
  if [ $exitCode -ne 0 ]; then
    echo "[ERROR] Problem starting ${CONTAINER}"
    return $exitCode
  fi
  docker compose exec -u node -it "${CONTAINER}" zsh && docker compose down
}

REPO_FUNCS+=("entercont")
function entercont {
  docker compose exec -u node -it "${CONTAINER}" zsh
}

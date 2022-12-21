#!/bin/bash

CONTAINER="#TOKEN:#SHELL__APP_NAME_DEV"
export REPO_FUNCS=()

# Wire up the current User so that any files created in development can easily
# be manipulated by the User or during test runs.
# Export to ensure `docker compose` can use'm
export CURR_UID=$(id -u)
export CURR_GID=$(id -g)

REPO_FUNCS+=("startcont")
function startcont {
  ./bin/prep-dist.sh
  docker compose up -d "${CONTAINER}"
  sleep 4
  docker compose exec -it "${CONTAINER}" zsh && docker compose down
}

REPO_FUNCS+=("entercont")
function entercont {
  docker compose exec "${CONTAINER}" zsh
}

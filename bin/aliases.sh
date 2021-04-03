#!/bin/sh

SCAFFOLD_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

function scaffold {
  local PROJECT_DIR="$PWD"
  
  (
    cd "${SCAFFOLD_DIR}" \
    && node scaffold.js "${PROJECT_DIR}"
  )
}

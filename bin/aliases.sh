#!/bin/sh

SCAFFOLD_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)

function scaffold {
  local PROJECT_DIR="$PWD"
  
  (
    cd "${SCAFFOLD_DIR}" \
    && node scaffold.js "${PROJECT_DIR}" \
    && printf "\n#[ RESULT ]#######\n\n" \
    && cd "${PROJECT_DIR}" \
    && find . -maxdepth 10 -mindepth 1 -type d | sort | sed -e "s/[^-][^\/]*\// │/g" -e "s/│\([^ ]\)/└─ \1/" \
    && find . -maxdepth 1 -mindepth 1 \! -type d | sort | sed -e "s/[^-][^\/]*\// │/g" -e "s/│\([^ ]\)/└─ \1/"
  )
}

#!/bin/sh

SCAFFOLD_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
PROJECT_DIR="$PWD"

alias scaffold="(cd \"${SCAFFOLD_DIR}\" && node scaffold.js \"${PROJECT_DIR}\")"

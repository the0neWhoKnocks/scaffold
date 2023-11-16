#!/bin/bash

DOCKER_HOST="host.docker.internal"
SCRIPT_DIR="$(cd "$(dirname "$0")" > /dev/null 2>&1; pwd -P)"
BUILD=true
WATCH_MODE=false
isLinux=false
isOSX=false
isWSL=false

# Parse arguments
while [ $# -gt 0 ]; do
  case $1 in
    --skip-build)
      BUILD=false
      ;;
    --watch)
      WATCH_MODE=true
      ;;
  esac
  shift
done

# Linux env
if [ -f "/proc/version" ]; then
  if grep -qE "(Microsoft|WSL)" /proc/version; then
    isWSL=true
  else
    isLinux=true
    DOCKER_HOST="172.17.0.1"
  fi
else
  isOSX=$(uname | grep -qi "darwin" &> /dev/null)
fi

APP_SERVICE="#TOKEN:#TEST_RUNNER__APP_NAME"
E2E_CONTAINER_NAME="e2e-#TOKEN:#TEST_RUNNER__APP_NAME"
E2E_SERVICE="e2e-#TOKEN:#TEST_RUNNER__APP_NAME"
cypressCmd=""
xlaunchPath="${SCRIPT_DIR}/XServer.xlaunch"
extraArgs="-e CYPRESS_baseUrl=#TOKEN:#TEST_RUNNER__PROTOCOL://${DOCKER_HOST}:3000"

# When watching for test changes, `open` (instead of `run`) Cypress so that the
# Dev can use the GUI for an easy test writing experience.
if $WATCH_MODE; then
  if $isWSL; then
    display="${DOCKER_HOST}:0"
    xlaunchBinary="/c/Program Files/VcXsrv/xlaunch.exe"
    xlaunchPath=$(wslpath -w "${SCRIPT_DIR}/XServer.xlaunch")
    xlaunchKillCmd="/c/Windows/System32/taskkill.exe /IM \"vcxsrv.exe\" /F"
    /c/Windows/System32/tasklist.exe | grep -q vcxsrv && SERVER_IS_RUNNING=true || SERVER_IS_RUNNING=false
    
    # If previous Server session wasn't terminated, kill it
    if $SERVER_IS_RUNNING; then
      echo;
      echo "[KILL] Previously running XServer session"
      eval "$xlaunchKillCmd"
    fi
  elif $isOSX; then
    xquartzBinary=$(which xquartz)
    xquartzKillCmd="osascript -e 'quit app \"xquartz\"'"
    IP=$(ifconfig en0 | grep inet | awk '$1=="inet" {print $2}')
    display="$IP:0"
  elif $isLinux; then
    IP=$(ip addr show | grep docker | grep -Eo 'inet ([^/]+)' | sed 's|inet ||')
    DBUS_PATH=$(echo "${DBUS_SESSION_BUS_ADDRESS}" | sed 's|unix:path=||')
    display="${DISPLAY}"
    extraArgs="${extraArgs} --user $(id -u):$(id -g) -e DBUS_SESSION_BUS_ADDRESS="${DBUS_SESSION_BUS_ADDRESS}" -v /tmp/.X11-unix:/tmp/.X11-unix:rw -v /run/dbus/system_bus_socket:/run/dbus/system_bus_socket -v ${DBUS_PATH}:${DBUS_PATH}"
  fi

  if [[ "$display" != "" ]]; then
    cypressCmd="docker compose run --name=${E2E_CONTAINER_NAME} -e DISPLAY=$display ${extraArgs} --rm --entrypoint cypress ${E2E_SERVICE} open --project ."
    
    if [[ "$xlaunchBinary" != "" ]] && [ -f "$xlaunchBinary" ]; then
      echo;
      echo "[START] XServer"
      "$xlaunchBinary" -run "$xlaunchPath"
    elif [[ "$xquartzBinary" != "" ]] && [ -f "$xquartzBinary" ]; then
      echo;
      echo "[START] XServer"
      xhost + "$IP"
    elif $isLinux; then
      echo;
      echo "[SET] xhost"
      # 'cypresstests' is the 'hostname' defined in docker-compose.yml
      xhost + local:cypresstests
    else
      echo "[ERROR] The XServer binary could not be located. Follow the instructions in the README to get it installed."
      echo;
      exit 1
    fi
  else
    echo;
    echo "[ERROR] You're trying to run watch mode but no \`DISPLAY\` was set for your OS, and one could not be determined."
    echo;
    exit 1
  fi
fi

if $BUILD; then
  echo;
  echo "[BUILD] App"
  npm run build
  
  echo;
  echo "[BUILD] Containers"
  docker compose build ${APP_SERVICE} ${E2E_SERVICE}
fi

echo;
echo "[START] Tests"
echo;
if [[ "$cypressCmd" != "" ]]; then
  echo "[RUN] ${cypressCmd}"
  ${cypressCmd}
else
  docker compose up "${extraArgs}" --abort-on-container-exit --remove-orphans "${E2E_SERVICE}"
fi
exitCode=$(echo $?)

docker compose down

if [[ "$xlaunchKillCmd" != "" ]]; then
  echo;
  echo "[KILL] XServer"
  eval "$xlaunchKillCmd"
elif [[ "$xquartzKillCmd" != "" ]]; then
  echo;
  echo "[KILL] XServer"
  eval "$xquartzKillCmd"
fi

exit $exitCode

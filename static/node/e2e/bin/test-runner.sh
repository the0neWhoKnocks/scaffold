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
    --name)
      CONT_NAME=$2
      shift
      ;;
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

APP_SERVICE="${CONT_NAME}-test"
CURR_GID=$(id -g)
CURR_UID=$(id -u)
#TOKEN:^TEST_RUNNER__FRAMEWORK__PLAYWRIGHT
E2E_COMPOSE_FILE="./e2e/docker-compose.yml"
#TOKEN:$TEST_RUNNER__FRAMEWORK__PLAYWRIGHT
E2E_CONTAINER_NAME="${CONT_NAME}-e2e"
E2E_SERVICE="${CONT_NAME}-e2e"
#TOKEN:^TEST_RUNNER__PROXY
PROXY_SERVICE="proxy"
#TOKEN:$TEST_RUNNER__PROXY
xlaunchPath="${SCRIPT_DIR}/XServer.xlaunch"
#TOKEN:^TEST_RUNNER__FRAMEWORK__PLAYWRIGHT
extraArgs=""
#TOKEN:$TEST_RUNNER__FRAMEWORK__PLAYWRIGHT

# When watching for test changes, `open` (instead of `run`) so that the Dev can
# use the runner's GUI for an easy test writing experience.
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
    #TOKEN:^TEST_RUNNER__FRAMEWORK__PLAYWRIGHT
    export VOL_X11='/tmp/.X11-unix:/tmp/.X11-unix:rw'
    export VOL_DBUS='/run/dbus/system_bus_socket:/run/dbus/system_bus_socket'
    
    # ensure folder is accessible by container mount (otherwise report creation will fail)
    chmod 777 e2e
    #TOKEN:$TEST_RUNNER__FRAMEWORK__PLAYWRIGHT
  fi
  
  if [[ "$display" != "" ]]; then
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
      # 'e2etests' is the 'hostname' defined in docker-compose.yml
      xhost + local:e2etests
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
  echo "[BUILD] Containers"
  #TOKEN:^TEST_RUNNER__FRAMEWORK__PLAYWRIGHT
  docker compose -f "${E2E_COMPOSE_FILE}" build ${APP_SERVICE} ${E2E_SERVICE} #TOKEN:#TEST_RUNNER__PROXY_SERVICE_REF
  #TOKEN:^TEST_RUNNER__FRAMEWORK__PLAYWRIGHT
fi

echo;
echo "[START] Tests"
echo;
#TOKEN:^TEST_RUNNER__FRAMEWORK__PLAYWRIGHT
if $WATCH_MODE; then
  export CMD="npx playwright test --ui"
  export TEST_DISPLAY="$display"
else
  export CMD="npx playwright test"
fi
# - Even though the App is started via E2E (depends_on), if it's not included here,
#   the test container won't abort if the App container dies.
# - Using `compose up` instead of `compose run` because `abort-on-container-exit`
#   doesn't work with `run`.
docker compose -f "${E2E_COMPOSE_FILE}" up --abort-on-container-exit --remove-orphans $APP_SERVICE $E2E_SERVICE
#TOKEN:$TEST_RUNNER__FRAMEWORK__PLAYWRIGHT
exitCode=$(echo $?)

#TOKEN:^TEST_RUNNER__FRAMEWORK__PLAYWRIGHT
docker compose -f "${E2E_COMPOSE_FILE}" down
#TOKEN:$TEST_RUNNER__FRAMEWORK__PLAYWRIGHT

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

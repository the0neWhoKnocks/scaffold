# //TOKEN:#README__TITLE

- [Development](#development)
//TOKEN:^README__DOCKER
- [Docker](#docker)
//TOKEN:$README__DOCKER
//TOKEN:^README__E2E
- [E2E Testing](#e2e-testing)
//TOKEN:$README__E2E
//TOKEN:^README__GH_PAGE
- [GitHub Page](#github-page)
//TOKEN:$README__GH_PAGE
//TOKEN:^README__HTTPS
- [Local HTTPS](#local-https)
//TOKEN:$README__HTTPS
//TOKEN:^README__LOGGING
- [Logging](#logging)
//TOKEN:$README__LOGGING

---

## Development

**NOTE** - Aliases to speed up workflow:
| Alias | Command          |
| ----- | ---------------- |
//TOKEN:^README__DOCKER
| `d`   | `docker`         |
| `dc`  | `docker compose` |
//TOKEN:$README__DOCKER
| `nr`  | `npm run`        |
//TOKEN:^README__DOCKER

**NOTE** - To ensure local development reflects what will end up in production, local files are exposed to a development Docker container. You can add `source <REPO_PATH>/bin/repo-funcs.sh` to your shell's rc file to use easier to remember commands.
To automate that process I `source` [this script](https://github.com/the0neWhoKnocks/shell-scripts/blob/master/override-cd.sh) instead, so anytime I `cd` in or out of a repo, the functions are added or removed when not at the root of the repo.

| Alias | Command |
| ----- | ------- |
| `startcont` |	Starts and enters the Container in development mode. |
| `entercont` | Enter the running development Container to debug or what ever. |
//TOKEN:$README__DOCKER

Install dependencies
```sh
//TOKEN:^README__DOCKER
# This should be run from within the Docker container to ensure Dev dependencies are installed.
//TOKEN:$README__DOCKER
npm i
```

Run the App
```sh
# Prod mode
nr start

# Dev mode
nr start:dev
```
//TOKEN:^README__DOCKER

---

## Docker

```sh
# Compile Production code (required since the assets are copied over)
nr build
# Build and start the container
dc up --build //TOKEN:#README__DC_CMD

# Or just start the container if you have 'dist' mapped or you just want to use the old build
dc up //TOKEN:#README__DC_CMD
```
//TOKEN:$README__DOCKER
//TOKEN:^README__E2E

---

## E2E Testing

In order to ensure Cypress runs consistently on all OS's for CI and the GUI mode I've opted for the Docker image. One downside to this is the size (over 2gb, yeesh). I tried the non-Docker route, and the setup would be different for all OS's and there was no guarantee it'd even work.

To get the GUI to work, follow the instructions for your OS.

**Windows/WSL**
- Install `choco install vcxsrv`

**OSX**
- Install `brew install xquartz`
- Start XQuartz `open -a xquartz`.
   - Go to Preferences > Security.
      - Make sure `Allow connections from network clients` is checked
- Once the settings have been updated you can close XQuartz
- If you run `echo $DISPLAY` and it's blank, restart your system. The variable should equal something like `/private/tmp/com.apple.launchd.7X4k55BnyT/org.xquartz:0`.

Once things are wired up you can run any of the below.

```sh
nr test
nr test:watch

# skips building the App and Container
nr test -- --skip-build
nr test:watch -- --skip-build
```
//TOKEN:$README__E2E
//TOKEN:^README__GH_PAGE

---

## GitHub Page

This repo utilizes GitHub workflows to auto-deploy a GitHub page.

- **Deployments**: `https://github.com/<USER>/<REPO>/deployments`
- **Settings**: `https://github.com/<USER>/<REPO>/settings/pages`
   - Ensure the `gh-pages` branch is set as the `Source`.
   - You can copy the URL for the published page at the top.

//TOKEN:$README__GH_PAGE
//TOKEN:^README__HTTPS

---

## Local HTTPS

Follow instructions from https://github.com/the0neWhoKnocks/generate-certs
//TOKEN:$README__HTTPS
//TOKEN:^README__LOGGING

---

## Logging

This App utilizes [ulog](https://www.npmjs.com/package/ulog).

On the Server you can enable logging via:
```sh
# setting an env var of `log` with a log level value
log=debug nr start:dev
log=error nr start:dev
log=info nr start:dev
```

On the Client you can enable logging via:
- A query param: `?log=debug` (for temporary logging)
- Local Storage: `localStorage.setItem('log', 'debug');` (to enable permanently).
//TOKEN:$README__LOGGING

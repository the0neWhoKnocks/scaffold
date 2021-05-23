# //TOKEN:#README__TITLE

- [Development](development)
//TOKEN:^README__HTTPS
- [Local HTTPS](local-https)
   - [Generate Certs for localhost](generate-certs-for-localhost)
   - [Generate Certs for Apps running on your LAN](generate-certs-for-apps-running-on-your-lan)
   - [Run your App with the certs](run-your-app-with-the-certs)
   - [Install the Certificate Authority in Chrome](install-the-certificate-authority-in-chrome)
   - [Install the Certificate Authority in Firefox](install-the-certificate-authority-in-firefox)
   - [Install the Certificate Authority on Android](install-the-certificate-authority-on-android)
//TOKEN:$README__HTTPS
//TOKEN:^README__LOGGING
- [Logging](logging)
//TOKEN:$README__LOGGING

---

## Development

Install dependencies
```sh
npm i
```

Run the App
```sh
# Prod mode
npm run start

# Dev mode
npm run start:dev
```
//TOKEN:^README__HTTPS
---

## Local HTTPS

Some experiences will complain if your App isn't run over `https`. To allow for secure Local development (and LAN Apps over IP), follow the below instructions to generate and install certs.

Run `./bin/gen-certs.sh --help` if you want to see the full list of options.

### Generate Certs for localhost

Run `./bin/gen-certs.sh -f "localhost" -d "localhost"`
- This'll create a `certs.localhost` folder with these files:
   ```sh
   /certs.localhost
     localhost.crt
     localhost.key
     localhost-CA.crt
     localhost-CA.key
   ```

You can then copy, move, or rename the generated folder. Wherever the folder ends up, that location will now be referred to as `<CERTS>`.

### Generate Certs for Apps running on your LAN

Creating certs for Apps running on an IP instead of a domain is pretty much the same as above, except you'll use the `-i` flag instead of `-d`, and provide an IP instead of a domain.

Run `./bin/gen-certs.sh -f "lan-apps" -i "192.168.1.337"`

### Run your App with the certs

The non-`-CA` files will be used for the App. When starting the App via Node or Docker, you'll need to set this environment variable:
```sh
`NODE_EXTRA_CA_CERTS="$PWD/<CERTS>/localhost.crt"`
```
- Note that `$PWD` expands to an absolute file path.
- The App automatically determines the `.key` file so long as the `.key` & `.crt` files have the same name.

### Install the Certificate Authority in Chrome

- Settings > In the top input, filter by `cert` > Click `Security`
- Click on `Manage certificates`
- Go the `Trusted Root Certification Authorities` tab
- Choose `Import`
- Find the `<CERTS>/localhost-CA.crt` file, and add it.
- If the cert doesn't seem to be working, try in Incognito first. If it's working there, then just restart Chrome to get it to work in non-Incognito.

### Install the Certificate Authority in Firefox

- Options > In the top input, filter by `cert` > Click `View Certificates...`
- Go to the `Authorities` tab
- Click on `Import`
- Find the `<CERTS>/localhost-CA.crt` file, and add it.
- Check `Trust this CA to identify websites`.

### Install the Certificate Authority on Android

- Copy the CA `.crt` & `.key` to the device
- Go to `Settings` > `Security` > Click on `Install from storage`
- Select the `.crt` file
- Give it a name
//TOKEN:$README__HTTPS
//TOKEN:^README__LOGGING
---

## Logging

This App utilizes [ulog](https://www.npmjs.com/package/ulog).

On the Server you can enable logging via:
```sh
# setting an env var of `log` with a loglevel value
log=debug npm run start:dev
log=error npm run start:dev
log=info npm run start:dev
```

On the Client you can enable logging via:
- A query param: `?log=debug` (for temporary logging)
- Local Storage: `localStorage.setItem('log', 'debug');` (to enable permanently).
//TOKEN:$README__LOGGING

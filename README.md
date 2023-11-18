# Scaffold

A CLI tool for scaffolding out projects.

---

## Install

- Clone the repo. The location of the cloned repo will now be referred to as `REPO_ROOT`.
- Install the dependencies
    ```sh
    # ensure you're in the proper directory
    cd REPO_ROOT
    # install Node deps and wire up git hooks
    npm i && git config --local core.hooksPath ./.githooks/
    ```
- In your shell's `rc` file source the aliases file
    ```sh
    # in a .zshrc file

    source "REPO_ROOT/bin/aliases.sh"
    ```
    Then source your shell to expose the `scaffold` function
    ```sh
    source ~/.zshrc
    ```

---

## Run

Just run the `scaffold` command, and answer the prompted questions.

---

## Development

To debug:
- Run
    ```sh
    node --inspect-brk scaffold.js "<PROJECT_FOLDER_PATH>"
    ```
- Go to [chrome://inspect/#devices](chrome://inspect/#devices) and click **Open dedicated DevTools for Node**.

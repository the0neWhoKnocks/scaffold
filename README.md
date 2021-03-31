# scaffold

A CLI for scaffolding out projects

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


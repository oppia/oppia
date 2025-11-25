Native Oppia install (macOS)

This file is a compact, copy-pasteable native macOS install reference derived from the Oppia wiki and adapted for Apple Silicon (M1/M2) and Intel Macs. Use it when you prefer to run Oppia without Docker.

Overview
- Create a Python 3.10 virtual environment (pyenv recommended)
- Install Node 16 and Yarn v1 (nvm recommended)
- Install required Python and JS deps
- Build the frontend (produces dist/oppia-angular)
- Start the dev server with the provided script

Notes about Apple Silicon (M1/M2)
- You can run everything natively on ARM. Alternatively, Oppia docs sometimes recommend using a Rosetta (Intel emulation) shell for certain setups — that is optional. If you run into Homebrew/pyenv issues, see the "Rosetta and Homebrew" section below.

1) Quick checks
```zsh
uname -m        # arm64 on M1/M2; x86_64 on Intel
which brew
brew --prefix
```

2) Install system tools (Homebrew, git, cmake, openjdk)
- If you don't have Homebrew: https://brew.sh/
- Use native Homebrew on Apple Silicon (prefix /opt/homebrew) unless you intentionally want an x86 Homebrew in /usr/local.

Run (ARM native shell):
```zsh
# Ensure /opt/homebrew is loaded in this session
eval "$(/opt/homebrew/bin/brew shellenv)"
# Persist it to new shells
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile

brew update
brew install git cmake openjdk@11 pyenv
```

3) (Optional) Rosetta 2 for Intel-emulation workflows
- If you prefer the Rosetta (x86) path (some users follow the Oppia wiki steps in an Intel-emulated shell):
```zsh
softwareupdate --install-rosetta
# create a Rosetta shell for commands that must run under x86
/usr/bin/arch -x86_64 $SHELL --login
# confirm: arch -> i386 or x86_64
```
- If you use Rosetta and you need Homebrew under x86, install it under /usr/local (the official install script will do that when run under `arch -x86_64`).

4) Install Python 3.10 with pyenv (recommended)
```zsh
# configure pyenv in your shell (add to ~/.zprofile or ~/.zshrc)
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.zprofile
echo 'export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.zprofile
echo 'eval "$(pyenv init --path)"' >> ~/.zprofile
source ~/.zprofile

pyenv install 3.10.16
pyenv global 3.10.16
python --version   # should be 3.10.x
```

5) Create a Python venv and pin pip/setuptools
```zsh
# from repo root
python -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip==25.3 setuptools==80.9.0
```

6) Install Node 16 and Yarn v1 (nvm recommended)
```zsh
# install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install 16
nvm use 16
node -v   # v16.x

# install Yarn v1 (Oppia expects Yarn 1.x)
npm install -g yarn@1.22.15 --force
yarn -v
```

7) Install Python third-party dependencies
- Prefer the repository helper which mirrors the Docker build:
```zsh
# activate .venv first
python -m scripts.install_third_party_libs
```
- If the script fails or you prefer manual installs:
```zsh
# fallback
pip install -r requirements.txt
pip install -r requirements_dev.txt
# If a package fails to build because of isolated build dependency download issues,
# try disabling build isolation:
PIP_NO_BUILD_ISOLATION=1 pip install -r requirements.txt
```

8) Install frontend JS packages and build
```zsh
# from repo root
yarn install --pure-lockfile
# Build the Angular app to create dist/oppia-angular
npx ng build --configuration=development --project=oppia-angular
# or use repo helpers / Makefile: make build
```

9) Start the dev server
```zsh
# with .venv activated, from repo root
python -m scripts.start
# Useful flags:
# --no_browser      (do not open a browser automatically)
# --skip-install    (skip the install step if you've already installed deps)
# --save_datastore  (preserve local datastore between runs)
```

10) Verify
- Visit http://localhost:8181 and the App Engine admin at http://localhost:8000
- If you see a 500 complaining about missing `dist/oppia-angular/index.html`, re-run step 8 and ensure the build succeeded.

Troubleshooting tips
- Homebrew architecture mismatch: if you see "Cannot install under Rosetta 2 in ARM default prefix (/opt/homebrew)", do one of:
  - Run the brew command under ARM: `arch -arm64 /opt/homebrew/bin/brew install <pkg>`
  - Start an ARM shell: `arch -arm64 zsh` (preferred for native builds)
  - Or install separate x86 Homebrew in /usr/local (only if you must use Rosetta for everything)

- Pip build isolation errors ("Could not find a version that satisfies setuptools>=..."):
  - Ensure setuptools is installed/upgraded in the venv (see step 5)
  - Use `PIP_NO_BUILD_ISOLATION=1 pip install ...` to force use of installed build deps
  - Pre-download required wheels into a local cache if you must operate offline

- Node/Yarn errors:
  - Ensure `node -v` reports v16.x and `yarn -v` reports 1.22.15
  - Remove `node_modules` and run `yarn install --pure-lockfile` in a clean state if dependencies are inconsistent

- Permission issues with `~/.npm` or `~/tmp` (npm/yarn writes there):
```zsh
sudo chown -R $(whoami) ~/tmp
sudo chown -R $(whoami) ~/.npm
```

- Use `python -m scripts.clean` to clear generated files and retry `python -m scripts.start` if installation fails.

Further notes
- The Oppia repo contains many helper scripts and a Makefile; `scripts.start` is the canonical local dev entrypoint (it installs third-party libraries and starts the dev services).
- If you want, I can add a small `docs/INSTALL_MACOS_NATIVE.md` (this file) to the repo, or create a `Makefile` target that automates the native steps. Tell me which.

References
- Oppia wiki: Installing Oppia (Mac OS; Python 3)
- Oppia `scripts/start.py` and `scripts/install_third_party_libs.py`



#!/usr/bin/env bash
set -euo pipefail

echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Render's filesystem does not allow Corepack to create global shims in /usr/bin.
# DO NOT run: corepack enable
# Keep Corepack/Yarn data inside the project workspace and invoke Yarn through Corepack.
export COREPACK_HOME="${PWD}/.corepack"
export YARN_ENABLE_GLOBAL_CACHE=false
export YARN_ENABLE_IMMUTABLE_INSTALLS=false
export YARN_NODE_LINKER=node-modules

if command -v corepack >/dev/null 2>&1; then
  echo "Using Corepack without global enable..."
  corepack prepare yarn@4.9.2 --activate
  corepack yarn --version

  # Yarn 4 does not support --immutable=false.
  # On CI, Yarn enables immutable installs by default, so we disable it through
  # YARN_ENABLE_IMMUTABLE_INSTALLS=false above and run a normal install.
  corepack yarn install
else
  echo "Corepack not available. Falling back to npm install."
  npm install --include=dev --no-audit --no-fund
fi

npm run build

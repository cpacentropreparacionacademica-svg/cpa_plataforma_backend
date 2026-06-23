#!/usr/bin/env bash
set -euo pipefail

echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Render's filesystem does not allow Corepack to create global shims in /usr/bin.
# DO NOT run: corepack enable
# Instead, keep Corepack/Yarn data inside the project workspace and invoke Yarn through Corepack.
export COREPACK_HOME="${PWD}/.corepack"
export YARN_ENABLE_GLOBAL_CACHE=false

if command -v corepack >/dev/null 2>&1; then
  echo "Using Corepack without global enable..."
  corepack prepare yarn@4.9.2 --activate
  corepack yarn --version

  # First deploys after dependency changes may need lockfile regeneration.
  # Once yarn.lock is updated locally and committed, this can be changed to --immutable.
  corepack yarn install --immutable=false
else
  echo "Corepack not available. Falling back to npm install."
  npm install --include=dev --no-audit --no-fund
fi

npm run build

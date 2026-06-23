#!/usr/bin/env bash
set -euo pipefail

# Render sometimes runs global Yarn Classic (v1) even when the repository
# contains a Yarn Berry lockfile. Corepack activates the Yarn version declared
# in package.json: "packageManager": "yarn@4.9.2".
corepack enable
corepack prepare yarn@4.9.2 --activate

# The project has changed dependencies several times during migration. This
# allows Render to regenerate the lock data during the first corrected deploy.
# After a successful deploy, run yarn install locally and commit yarn.lock;
# then this can be changed back to: yarn install --immutable
yarn install --immutable=false

yarn build

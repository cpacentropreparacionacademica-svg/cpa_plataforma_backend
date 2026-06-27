#!/usr/bin/env bash
set -euo pipefail

echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Render puede reutilizar cache de builds anteriores. Si TypeScript incremental
# encuentra un dist/ o un *.tsbuildinfo viejo, puede generar solo .d.ts y dejar
# fuera dist/main.js. Por eso SIEMPRE limpiamos salida e incremental antes de compilar.
echo "Limpiando salida anterior de TypeScript/Nest..."
rm -rf dist
rm -f tsconfig.tsbuildinfo tsconfig.build.tsbuildinfo
find . -maxdepth 3 -name "*.tsbuildinfo" -type f -delete || true

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
  corepack yarn install
  corepack yarn build
else
  echo "Corepack not available. Falling back to npm install."
  npm install --include=dev --no-audit --no-fund
  npm run build
fi

echo "Verificando salida del build..."
if [ -f "dist/main.js" ]; then
  echo "OK: dist/main.js generado."
elif [ -f "dist/src/main.js" ]; then
  echo "OK: dist/src/main.js generado. El start script lo detectará automáticamente."
else
  echo "ERROR: no se encontró dist/main.js ni dist/src/main.js."
  echo "Contenido de dist:"
  find dist -maxdepth 4 -type f | sort || true
  exit 1
fi

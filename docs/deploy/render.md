# Deploy en Render

## Error corregido

Render puede fallar con Yarn por dos motivos distintos:

1. `yarn install --frozen-lockfile` falla si `package.json` y `yarn.lock` no están sincronizados.
2. `corepack enable` falla en Render porque intenta crear/modificar shims globales en `/usr/bin`, pero ese directorio puede estar en modo solo lectura.

El error típico del segundo caso es:

```txt
Internal Error: EROFS: read-only file system, unlink '/usr/bin/pnpm'
```

## Build Command recomendado

En Render, usar:

```bash
bash scripts/render-build.sh
```

## Start Command recomendado

```bash
node dist/main.js
```

## Qué hace `scripts/render-build.sh`

1. No ejecuta `corepack enable`.
2. Define `COREPACK_HOME` dentro del workspace del proyecto.
3. Prepara Yarn 4.9.2 con Corepack sin modificar `/usr/bin`.
4. Instala dependencias con `corepack yarn install`.
5. Compila con `npm run build`.

## Después del deploy exitoso

En local, ejecutar:

```bash
corepack enable
corepack prepare yarn@4.9.2 --activate
yarn install
git add package.json yarn.lock .yarnrc.yml scripts/render-build.sh render.yaml docs/deploy/render.md
git commit -m "fix: make Render build avoid global corepack shims"
git push
```

Luego puedes cambiar en `scripts/render-build.sh`:

```bash
corepack yarn install
```

por:

```bash
corepack yarn install --immutable
```

solo cuando `yarn.lock` ya esté actualizado y committeado.


## Nota importante Yarn 4

Yarn 4 no acepta `--immutable=false`. En Render/CI se desactiva el modo immutable usando `YARN_ENABLE_IMMUTABLE_INSTALLS=false` y luego se ejecuta `corepack yarn install`.

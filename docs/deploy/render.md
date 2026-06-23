# Deploy en Render

## Error corregido

Render estaba ejecutando:

```bash
yarn install --frozen-lockfile --production=false && yarn build
```

pero el repositorio contiene un `yarn.lock` de Yarn Berry/Yarn 4, mientras que Render estaba usando Yarn Classic 1.22.22. Por eso aparece:

```txt
error Your lockfile needs to be updated, but yarn was run with `--frozen-lockfile`.
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

1. Activa Corepack.
2. Fuerza Yarn 4.9.2, que coincide con el lockfile moderno.
3. Instala dependencias permitiendo regenerar lock en este primer deploy corregido.
4. Compila NestJS.

## Después del primer deploy exitoso

En local, ejecutar:

```bash
corepack enable
corepack prepare yarn@4.9.2 --activate
yarn install
git add package.json yarn.lock .yarnrc.yml scripts/render-build.sh render.yaml docs/deploy/render.md
git commit -m "fix: align Render build with Yarn Berry lockfile"
git push
```

Luego, para un modo más estricto en CI, se puede cambiar en `scripts/render-build.sh`:

```bash
yarn install --immutable=false
```

por:

```bash
yarn install --immutable
```

siempre que `yarn.lock` ya esté actualizado y committeado.

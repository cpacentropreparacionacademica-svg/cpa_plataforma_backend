# Fix Render build: dist/main.js no generado

## Error observado

Render ejecutaba `bash scripts/render-build.sh`, compilaba NestJS, pero al validar la salida fallaba con:

```txt
ERROR: no se encontró dist/main.js ni dist/src/main.js.
```

En el `dist/` aparecían muchos archivos `.d.ts`, pero faltaba `dist/main.js`.

## Causa probable

Render estaba reutilizando cache de builds anteriores. Como el proyecto usa TypeScript incremental, un `dist/` parcial o un `*.tsbuildinfo` viejo puede hacer que el build quede inconsistente y emita declaraciones `.d.ts`, pero no el JavaScript de entrada esperado.

Además, Render eligió Node `26.4.0` porque `package.json` permitía `>=20 <27`. Para producción es más estable pinnear Node LTS.

## Cambios aplicados

1. `scripts/render-build.sh` ahora limpia antes de compilar:

```bash
rm -rf dist
rm -f tsconfig.tsbuildinfo tsconfig.build.tsbuildinfo
find . -maxdepth 3 -name "*.tsbuildinfo" -type f -delete || true
```

2. El build ahora se ejecuta con Yarn cuando Corepack está disponible:

```bash
corepack yarn build
```

3. `package.json` ahora fija Node LTS:

```json
"engines": {
  "node": "22.x"
}
```

## En Render

Después de subir este cambio, hacer:

1. Commit y push a `main`.
2. En Render: `Manual Deploy`.
3. Si sigue usando cache viejo, ejecutar `Clear build cache & deploy`.


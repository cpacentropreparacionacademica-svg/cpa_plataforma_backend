# Fix smoke:all - parámetro PostgreSQL no tipado

Este ajuste corrige `scripts/demo-user-utils.js`.

## Problema

PostgreSQL fallaba con:

```txt
could not determine data type of parameter $2
```

La consulta usaba `$1`, `$3`, `$4`, `$5`, pero no usaba `$2`. Al enviar el arreglo de parámetros, PostgreSQL no podía inferir el tipo del parámetro `$2`.

## Corrección

Se renumeraron los placeholders:

- `$3` -> `$2`
- `$4` -> `$3::text[]`
- `$5` -> `$4::text[]`

Y se quitó el parámetro sobrante del arreglo.

## Comandos recomendados

```powershell
yarn test:smoke
```

Luego:

```powershell
yarn test:smoke:all
```

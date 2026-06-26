# Smoke de importaciones masivas, errores de negocio y backup Render

Este documento valida la etapa de QA más exigente del backend CPA Plataforma.

## 1. Nuevo smoke test

Archivo:

```txt
test/smoke.imports-business.spec.ts
```

Comando:

```bash
yarn test:smoke:imports-business
```

Incluido dentro de:

```bash
yarn test:smoke:all
```

## 2. Qué prueba exactamente

### Importaciones masivas JSON

Valida y procesa:

```http
POST /api/personas/unidad-educativa/batch/validate
POST /api/personas/unidad-educativa/batch/process
```

con payload:

```json
{
  "mode": "create",
  "items": [
    { "nombre": "SMOKE IMPORT JSON 1", "categoria": "privada" },
    { "nombre": "SMOKE IMPORT JSON 2", "categoria": "privada" }
  ]
}
```

### Importaciones masivas CSV

Valida y procesa archivo `.csv` enviado como `multipart/form-data`.

Columnas esperadas para la prueba:

```csv
nombre,categoria
SMOKE IMPORT CSV 1,privada
SMOKE IMPORT CSV 2,privada
```

### Importaciones masivas Excel

Valida y procesa archivo `.xlsx` enviado como `multipart/form-data`.

Columnas esperadas:

```txt
nombre
categoria
```

### Errores de importación

Valida que el backend detecte:

```txt
- columnas inexistentes
- filas sin columnas válidas
- intentos de procesar archivos con errores
```

### Errores de negocio contable

Valida que el backend rechace:

```txt
- venta-clase con CxC sin id_estudiante
- venta-clase descuadrada: total venta distinto a formas de pago
- venta-clase con montos negativos
- asiento contable desbalanceado
- duplicado de cuenta contable por constraint único
```

## 3. Comando recomendado para QA completo local

```bash
yarn install
yarn db:migrate:prod:fresh
yarn test:smoke:all
```

## 4. Backup PostgreSQL para Render Cron Job

Script:

```txt
scripts/backup-postgres.js
```

Comando:

```bash
yarn backup:postgres
```

El script genera un backup lógico `.sql.gz` usando `pg_dump`. Puede subir el archivo por HTTP y/o restaurarlo en otra base PostgreSQL/Neon usando `BACKUP_TARGET_DATABASE_URL`.

## 5. Variables de entorno para backup

Obligatorias para conexión:

```env
DATABASE_URL=postgresql://...
```

O alternativamente:

```env
PGHOST=...
PGPORT=5432
PGUSER=...
PGPASSWORD=...
PGDATABASE=...
```

Destino externo:

```env
BACKUP_UPLOAD_URL=https://tu-otro-host-render.com/api/backups/cpa
```

Opcionales:

```env
BACKUP_UPLOAD_TOKEN=token-secreto
BACKUP_UPLOAD_METHOD=POST
BACKUP_UPLOAD_FIELD=file
BACKUP_UPLOAD_HEADERS_JSON={"X-Backup-Source":"cpa"}
BACKUP_LOCAL_DIR=/tmp/cpa-backups
BACKUP_DELETE_LOCAL_AFTER_UPLOAD=true
BACKUP_PREFIX=cpa-postgres
BACKUP_SOURCE_NAME=cpa-plataforma-backend
BACKUP_SCHEMAS=administracion,contabilidad,deuda,infraestructura,inventario,persona,seguridad,servicios_educativos,societario,public
PG_DUMP_BIN=pg_dump
```


## 5.1 Backup hacia otro host Neon/PostgreSQL

Si quieres que el cron deje una copia restaurada en otra base Neon, define:

```env
BACKUP_TARGET_DATABASE_URL=postgresql://usuario:password@host-neon-backup/db?sslmode=require
BACKUP_RESTORE_TO_TARGET=true
BACKUP_TARGET_CONFIRM=I_UNDERSTAND_TARGET_WILL_BE_REPLACED
```

Esto hace:

```txt
1. pg_dump desde la base principal.
2. Genera archivo .sql.gz.
3. Ejecuta restore con psql hacia BACKUP_TARGET_DATABASE_URL.
```

Advertencia: la base destino puede ser reemplazada por el dump porque el backup se genera con `--clean --if-exists`. Usa una base Neon separada exclusivamente para respaldo, no tu base productiva.

También puedes usar simultáneamente:

```env
BACKUP_UPLOAD_URL=https://tu-host.com/api/backups/cpa
```

para guardar archivo y además restaurar en Neon.


## 5.2 Dónde colocar el link/conexión del otro Neon

El espacio formal está en `.env.example`. Copia esas variables a tu `.env` local o a las Environment Variables de Render.

Variable principal para el otro proyecto/branch/base de Neon:

```env
BACKUP_TARGET_DATABASE_URL=postgresql://usuario:password@host-backup.neon.tech/neondb?sslmode=require
```

Para que el cron realmente restaure ahí, activa también:

```env
BACKUP_RESTORE_TO_TARGET=true
BACKUP_TARGET_CONFIRM=I_UNDERSTAND_TARGET_WILL_BE_REPLACED
```

Si solo quieres generar/subir archivo pero no restaurar en Neon, deja:

```env
BACKUP_RESTORE_TO_TARGET=false
```

Regla crítica: `BACKUP_TARGET_DATABASE_URL` debe apuntar a una base distinta a `DATABASE_URL`. No uses la misma base de producción como destino.

## 6. Render Cron Job

En `render.yaml` se agrega un servicio tipo cron:

```yaml
- type: cron
  name: cpa-plataforma-backup
  env: node
  schedule: "0 7 * * *"
  buildCommand: bash scripts/render-build.sh
  startCommand: node scripts/backup-postgres.js
```

La hora `0 7 * * *` equivale aproximadamente a las 03:00 en Bolivia cuando Bolivia está en UTC-4.

## 7. Nota importante sobre pg_dump

El script necesita que `pg_dump` exista en el entorno donde corre el cron. Si además restauras a otro Neon/PostgreSQL, también necesita `psql`.

Si Render Native Node no lo trae disponible, hay tres opciones profesionales:

```txt
1. Usar un servicio Render Docker con postgresql-client instalado.
2. Definir PG_DUMP_BIN y PSQL_BIN apuntando a rutas disponibles.
3. Ejecutar el cron desde un entorno separado que sí tenga pg_dump y psql.
```

No conviene simular backup completo sin `pg_dump`, porque un backup incompleto da una falsa sensación de seguridad.


## Configuración Render recomendada para backup temporal

```env
BACKUP_LOCAL_DIR=/tmp/cpa-backups
BACKUP_PREFIX=cpa-postgres
BACKUP_SOURCE_NAME=cpa-plataforma-backend
BACKUP_DELETE_LOCAL_AFTER_UPLOAD=true
```

Estos valores están pensados para Render: `/tmp` es almacenamiento temporal, el archivo se genera como `.sql.gz` y luego se sube/restaura según las variables `BACKUP_UPLOAD_URL` o `BACKUP_TARGET_DATABASE_URL`.
